/**
 * OpenAPI 3.0 Parser for APIClaw Direct Call
 * Converts OpenAPI spec to APIClaw action format
 */

export interface ParsedAction {
  name: string;
  displayName: string;
  description: string;
  method: string;
  path: string;
  params: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    in: 'body' | 'query' | 'path';
  }[];
  selected: boolean;
}

export interface ParseResult {
  success: boolean;
  actions: ParsedAction[];
  error?: string;
  apiTitle?: string;
  apiDescription?: string;
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
}

function toTitleCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function mapOpenAPIType(schema: any): string {
  if (!schema) return 'string';
  
  if (schema.type === 'integer' || schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'object' || schema.type === 'array') return 'object';
  return 'string';
}

function extractParams(operation: any, pathParams: any[]): ParsedAction['params'] {
  const params: ParsedAction['params'] = [];
  
  // Path and query parameters
  const allParams = [...(pathParams || []), ...(operation.parameters || [])];
  
  for (const param of allParams) {
    if (param.in === 'header' || param.in === 'cookie') continue; // Skip headers/cookies
    
    params.push({
      name: param.name,
      type: mapOpenAPIType(param.schema),
      required: param.required || false,
      description: param.description || '',
      in: param.in as 'path' | 'query',
    });
  }
  
  // Request body parameters
  if (operation.requestBody?.content) {
    const content = operation.requestBody.content;
    const jsonContent = content['application/json'] || content['*/*'];
    
    if (jsonContent?.schema) {
      const schema = jsonContent.schema;
      
      // Handle direct properties
      if (schema.properties) {
        const required = schema.required || [];
        
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          const prop = propSchema as any;
          params.push({
            name: propName,
            type: mapOpenAPIType(prop),
            required: required.includes(propName),
            description: prop.description || '',
            in: 'body',
          });
        }
      }
    }
  }
  
  return params;
}

export async function parseOpenAPISpec(url: string): Promise<ParseResult> {
  try {
    // Fetch the spec
    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, actions: [], error: `Failed to fetch: ${response.status}` };
    }
    
    const spec = await response.json();
    
    // Validate it's OpenAPI 3.x
    if (!spec.openapi?.startsWith('3.')) {
      return { 
        success: false, 
        actions: [], 
        error: 'Only OpenAPI 3.x is supported. Found: ' + (spec.openapi || spec.swagger || 'unknown') 
      };
    }
    
    const actions: ParsedAction[] = [];
    
    // Iterate through paths
    for (const [path, pathItem] of Object.entries(spec.paths || {})) {
      const pathObj = pathItem as any;
      const pathParams = pathObj.parameters || [];
      
      // Iterate through methods
      for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
        const operation = pathObj[method];
        if (!operation) continue;
        
        // Generate action name from operationId or path+method
        const operationId = operation.operationId;
        const actionName = operationId 
          ? toSnakeCase(operationId)
          : toSnakeCase(`${method}_${path.replace(/[{}]/g, '').replace(/\//g, '_')}`);
        
        // Generate display name
        const displayName = operationId
          ? toTitleCase(operationId)
          : toTitleCase(`${method} ${path}`);
        
        // Get description
        const description = operation.summary || operation.description || `${method.toUpperCase()} ${path}`;
        
        // Extract parameters
        const params = extractParams(operation, pathParams);
        
        actions.push({
          name: actionName,
          displayName,
          description,
          method: method.toUpperCase(),
          path,
          params,
          selected: true, // Default to selected
        });
      }
    }
    
    return {
      success: true,
      actions,
      apiTitle: spec.info?.title,
      apiDescription: spec.info?.description,
    };
    
  } catch (error) {
    return {
      success: false,
      actions: [],
      error: error instanceof Error ? error.message : 'Failed to parse OpenAPI spec',
    };
  }
}
