import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { createHash } from "node:crypto";
import ts from "typescript";

export interface PublicFunction {
  id: string;
  kind: "query" | "mutation" | "action";
  handler: ts.Node;
  registration: ts.Node;
  source: ts.SourceFile;
  checker: ts.TypeChecker;
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "_generated" || entry.name === "node_modules") return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path)
      : /\.[cm]?[jt]sx?$/.test(entry.name) && !/\.(test|spec)\.|\.d\.ts$/.test(entry.name) ? [path] : [];
  });
}

/** Use Convex's registered function types, including aliases and re-exports. */
export function inventoryPublicFunctions(directory = "convex"): PublicFunction[] {
  const files = sourceFiles(directory);
  const config = ts.readConfigFile(join(directory, "tsconfig.json"), ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, directory);
  const program = ts.createProgram(files, parsed.options);
  const syntaxErrors = program.getSyntacticDiagnostics();
  if (syntaxErrors.length) throw new Error("Convex source must parse before public exports can be reviewed");
  const checker = program.getTypeChecker();
  const result: PublicFunction[] = [];
  for (const path of files) {
    const source = program.getSourceFile(path);
    if (!source) throw new Error(`Missing source: ${path}`);
    const module = checker.getSymbolAtLocation(source);
    if (!module) continue;
    for (const exported of checker.getExportsOfModule(module)) {
      const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      const declaration = symbol.valueDeclaration;
      if (!declaration) continue;
      const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
      // An unresolved exported value must fail closed rather than disappear.
      if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
        throw new Error(`Unresolved Convex export: ${path}:${exported.name}`);
      }
      if (!type.getProperty("isPublic")) continue;
      const kind = type.getProperty("isQuery") ? "query"
        : type.getProperty("isMutation") ? "mutation"
        : type.getProperty("isAction") ? "action" : null;
      if (!kind) continue; // HTTP actions have separate route/auth tests.
      if (!ts.isVariableDeclaration(declaration) || !declaration.initializer ||
          !ts.isCallExpression(declaration.initializer)) {
        throw new Error(`Review nonstandard registration: ${path}:${exported.name}`);
      }
      const options = declaration.initializer.arguments[0];
      if (!options || !ts.isObjectLiteralExpression(options)) throw new Error(`Review registration: ${path}:${exported.name}`);
      const handler = options.properties.find((property) => property.name?.getText() === "handler");
      if (!handler || !ts.isPropertyAssignment(handler)) throw new Error(`Missing handler: ${path}:${exported.name}`);
      result.push({
        id: `${relative(directory, path).replace(/\\/g, "/").replace(/\.[^.]+$/, "")}:${exported.name}`,
        kind, handler: handler.initializer, registration: options, source: declaration.getSourceFile(), checker,
      });
    }
  }
  return result.sort((a, b) => a.id.localeCompare(b.id));
}

const trustedChecks: Record<string, string[]> = {
  "sessionSecurity.ts": ["findUsableAgentSession", "findAgentSessionByToken"],
  "functionAuth.ts": ["requireInternalSecret", "requireWorkspaceCaller"],
  "workspaces.ts": ["requireAdminSecret"],
  "managedRouting.ts": ["requireAdminSecret"],
  "cliAuth.ts": ["requireServerBridgeSecret"],
  "bookingGuard.ts": ["requireInternalSecret"],
  "discoveryListings.ts": ["owner", "requireOperator"],
  "onboarding.ts": ["workspaceFromToken"],
  "guards.ts": ["resolveVerifiedOwner"],
  "mcpOAuth.ts": ["requireWorkspaceFromSession", "assertCanRegisterDynamicClient"],
};

/** Only actual calls to reviewed credential validators count, never argument names or comments. */
export function hasReviewedAuthCheck(entry: PublicFunction): boolean {
  let found = false;
  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      let symbol = entry.checker.getSymbolAtLocation(node.expression);
      if (symbol?.flags && symbol.flags & ts.SymbolFlags.Alias) symbol = entry.checker.getAliasedSymbol(symbol);
      const declaration = symbol?.valueDeclaration;
      if (declaration && symbol) {
        const file = relative(resolve("convex"), resolve(declaration.getSourceFile().fileName)).replace(/\\/g, "/");
        if (trustedChecks[file]?.includes(symbol.name)) found = true;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(entry.handler);
  return found;
}

export function registrationDigest(entry: PublicFunction): string {
  // Print the AST so formatting and comments do not create allowlist churn.
  const printed = ts.createPrinter({ removeComments: true }).printNode(ts.EmitHint.Unspecified, entry.registration, entry.source);
  return createHash("sha256").update(printed).digest("hex");
}

export interface PublicException { reason: string; registrationSha256: string }

export function checkPublicInventory(entries: PublicFunction[], allowlistPath = "convex/public-function-allowlist.json"): string[] {
  const exceptions = JSON.parse(readFileSync(allowlistPath, "utf8")) as Record<string, PublicException>;
  const authenticated = JSON.parse(readFileSync("convex/public-function-auth-reviews.json", "utf8")) as Record<string, PublicException>;
  const errors: string[] = [];
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  for (const [id, exception] of Object.entries({ ...exceptions, ...authenticated })) {
    const entry = byId.get(id);
    if (!entry) errors.push(`Stale public exception: ${id}`);
    else if (!exception.reason?.trim() || exception.reason.includes("\n")) errors.push(`Missing one-line review reason: ${id}`);
    else if (registrationDigest(entry) !== exception.registrationSha256) errors.push(`Public behavior changed; review the allowlist reason and registration: ${id}`);
  }
  for (const entry of entries) {
    if (!exceptions[entry.id] && !authenticated[entry.id] && !hasReviewedAuthCheck(entry)) {
      errors.push(`Unauthenticated public ${entry.kind}: ${entry.id}. Make it internal, validate credentials, or review a necessary public exception.`);
    }
  }
  return errors;
}
