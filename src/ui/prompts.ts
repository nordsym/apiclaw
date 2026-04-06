/**
 * APIClaw MCP Auto-Setup - Interactive Prompts
 * 
 * Inquirer-based prompts for the --wizard mode.
 * Provides a guided, interactive setup experience.
 */

import inquirer from 'inquirer';
import { colors, icons, header, box, codeBlock, added, bulletList } from './colors.js';

/**
 * Detected client information
 */
export interface DetectedClient {
  id: string;
  name: string;
  detected: boolean;
  configPath: string;
  alreadyConfigured: boolean;
}

/**
 * Configuration change preview
 */
export interface ConfigChange {
  clientId: string;
  clientName: string;
  configPath: string;
  action: 'create' | 'update' | 'skip';
  diff?: string;
}

/**
 * Wizard result
 */
export interface WizardResult {
  selectedClients: string[];
  workspace?: string;
  confirmed: boolean;
  dryRun: boolean;
}

/**
 * Display welcome banner
 */
export function showWelcome(): void {
  console.log(header('APIClaw MCP Auto-Setup'));
  console.log(colors.secondary('Configure APIClaw as an MCP server across your AI coding assistants.\n'));
}

/**
 * Prompt for client selection
 */
export async function selectClients(clients: DetectedClient[]): Promise<string[]> {
  console.log(colors.info(`${icons.search} Detected MCP clients:\n`));
  
  // Show detection results
  for (const client of clients) {
    if (client.detected) {
      const status = client.alreadyConfigured 
        ? colors.warning(`(already configured)`)
        : colors.success('(detected)');
      console.log(`  ${icons.success} ${colors.highlight(client.name)} ${status}`);
      console.log(colors.muted(`    ${client.configPath}`));
    } else {
      console.log(`  ${icons.pending} ${colors.muted(client.name)} ${colors.muted('(not found)')}`);
    }
  }
  console.log();
  
  const detectedClients = clients.filter(c => c.detected);
  
  if (detectedClients.length === 0) {
    console.log(colors.warning('No MCP clients detected on this system.'));
    console.log(colors.secondary('\nYou can still configure a custom path.\n'));
  }
  
  const choices = clients.map(client => ({
    name: `${client.name}${client.detected ? '' : ' (not detected)'}${client.alreadyConfigured ? ' ⚠️ already configured' : ''}`,
    value: client.id,
    checked: client.detected && !client.alreadyConfigured,
    disabled: !client.detected && client.id !== 'custom' ? 'Not installed' : false,
  }));
  
  // Add custom option
  choices.push({
    name: 'Custom config path...',
    value: 'custom',
    checked: false,
    disabled: false,
  });
  
  const { selected } = await inquirer.prompt<{ selected: string[] }>([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Which clients do you want to configure?',
      choices,
      validate: (answer: string[]) => {
        if (answer.length === 0) {
          return 'Please select at least one client.';
        }
        return true;
      },
    },
  ]);
  
  return selected;
}

/**
 * Prompt for custom config path
 */
export async function promptCustomPath(): Promise<string> {
  const { customPath } = await inquirer.prompt<{ customPath: string }>([
    {
      type: 'input',
      name: 'customPath',
      message: 'Enter the path to your MCP config file:',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Please enter a valid path.';
        }
        if (!input.endsWith('.json')) {
          return 'Config file should be a .json file.';
        }
        return true;
      },
    },
  ]);
  
  return customPath;
}

/**
 * Prompt for workspace ID
 */
export async function promptWorkspace(): Promise<string | undefined> {
  const { hasWorkspace } = await inquirer.prompt<{ hasWorkspace: boolean }>([
    {
      type: 'confirm',
      name: 'hasWorkspace',
      message: 'Do you have an APIClaw workspace ID to link?',
      default: false,
    },
  ]);
  
  if (!hasWorkspace) {
    return undefined;
  }
  
  const { workspace } = await inquirer.prompt<{ workspace: string }>([
    {
      type: 'input',
      name: 'workspace',
      message: 'Enter your workspace ID:',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Please enter a workspace ID.';
        }
        if (!input.startsWith('ws_')) {
          return 'Workspace ID should start with "ws_"';
        }
        return true;
      },
    },
  ]);
  
  return workspace;
}

/**
 * Show preview of changes and confirm
 */
export async function confirmChanges(
  changes: ConfigChange[],
  options: { dryRun?: boolean } = {}
): Promise<boolean> {
  console.log(header('Review Changes'));
  
  for (const change of changes) {
    const actionLabel = {
      create: colors.success('CREATE'),
      update: colors.warning('UPDATE'),
      skip: colors.muted('SKIP'),
    }[change.action];
    
    console.log(`${actionLabel} ${colors.highlight(change.clientName)}`);
    console.log(colors.muted(`  ${change.configPath}\n`));
    
    if (change.diff) {
      console.log(codeBlock(change.diff));
      console.log();
    }
  }
  
  if (options.dryRun) {
    console.log(box(
      colors.info('Dry-run mode: No changes will be made.'),
      { borderColor: colors.info }
    ));
    console.log();
    return true;
  }
  
  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Apply these changes?',
      default: true,
    },
  ]);
  
  return confirmed;
}

/**
 * Prompt for force overwrite
 */
export async function confirmForce(clientName: string): Promise<boolean> {
  const { force } = await inquirer.prompt<{ force: boolean }>([
    {
      type: 'confirm',
      name: 'force',
      message: `${clientName} already has APIClaw configured. Overwrite?`,
      default: false,
    },
  ]);
  
  return force;
}

/**
 * Show success message with next steps
 */
export function showSuccess(configuredClients: string[]): void {
  console.log();
  console.log(box(
    `${icons.check} APIClaw configured successfully!\n\n` +
    `Configured: ${configuredClients.join(', ')}`,
    { title: 'Success', borderColor: colors.success }
  ));
  
  console.log(colors.secondary('\nNext steps:'));
  console.log(bulletList([
    `Restart ${configuredClients.join(' / ')}`,
    'Ask your agent: "List available APIs"',
  ], 2));
  
  console.log(colors.secondary('\nNeed help?'));
  console.log(`  ${colors.link('https://apiclaw.cloud/docs/setup')}\n`);
}

/**
 * Show dry-run summary
 */
export function showDryRunSummary(changes: ConfigChange[]): void {
  console.log();
  console.log(box(
    `${icons.info} Dry-run complete\n\n` +
    `Would configure: ${changes.filter(c => c.action !== 'skip').length} client(s)\n` +
    `Would skip: ${changes.filter(c => c.action === 'skip').length} client(s)`,
    { title: 'Dry Run', borderColor: colors.info }
  ));
  
  console.log(colors.secondary('\nTo apply changes, run:'));
  console.log(colors.action('  npx @nordsym/apiclaw setup\n'));
}

/**
 * Run the full interactive wizard
 */
export async function runWizard(
  clients: DetectedClient[],
  options: { dryRun?: boolean } = {}
): Promise<WizardResult> {
  showWelcome();
  
  // Select clients
  const selectedClients = await selectClients(clients);
  
  // Handle custom path if selected
  const finalClients = [...selectedClients];
  if (selectedClients.includes('custom')) {
    const customPath = await promptCustomPath();
    // Remove 'custom' placeholder and add actual path
    const idx = finalClients.indexOf('custom');
    finalClients[idx] = `custom:${customPath}`;
  }
  
  // Optionally link workspace
  const workspace = await promptWorkspace();
  
  // Build preview changes
  const changes: ConfigChange[] = finalClients.map(clientId => {
    const isCustom = clientId.startsWith('custom:');
    const client = isCustom 
      ? { id: 'custom', name: 'Custom', configPath: clientId.replace('custom:', ''), alreadyConfigured: false }
      : clients.find(c => c.id === clientId)!;
    
    return {
      clientId: client.id,
      clientName: client.name,
      configPath: client.configPath,
      action: client.alreadyConfigured ? 'skip' : 'update',
      diff: generateDiff(workspace),
    };
  });
  
  // Confirm changes
  const confirmed = await confirmChanges(changes, { dryRun: options.dryRun });
  
  return {
    selectedClients: finalClients,
    workspace,
    confirmed,
    dryRun: options.dryRun || false,
  };
}

/**
 * Generate diff preview for config change
 */
function generateDiff(workspace?: string): string {
  const lines = [
    added('"apiclaw": {'),
    added('  "command": "npx",'),
    added('  "args": ["-y", "@nordsym/apiclaw"]'),
  ];
  
  if (workspace) {
    lines.splice(2, 0, added(`  "env": { "APICLAW_WORKSPACE": "${workspace}" },`));
  }
  
  lines.push(added('}'));
  
  return lines.join('\n');
}

/**
 * Prompt for restore backup selection
 */
export async function selectBackup(backups: { path: string; date: Date; client: string }[]): Promise<string | null> {
  if (backups.length === 0) {
    console.log(colors.warning('No backups found.'));
    return null;
  }
  
  const choices = backups.map(b => ({
    name: `${b.client} - ${b.date.toLocaleString()} (${b.path})`,
    value: b.path,
  }));
  
  choices.push({
    name: 'Cancel',
    value: '',
  });
  
  const { backup } = await inquirer.prompt<{ backup: string }>([
    {
      type: 'list',
      name: 'backup',
      message: 'Select a backup to restore:',
      choices,
    },
  ]);
  
  return backup || null;
}

/**
 * Confirm uninstall
 */
export async function confirmUninstall(clients: string[]): Promise<boolean> {
  console.log(colors.warning('\n⚠️  This will remove APIClaw from:\n'));
  console.log(bulletList(clients, 2));
  console.log();
  
  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Are you sure you want to uninstall APIClaw?',
      default: false,
    },
  ]);
  
  return confirmed;
}
