import { resolveCliPathFromVSCodeExecutablePath } from '@vscode/test-electron';
import * as path from 'path';
import * as vscode from 'vscode';
import { workspace, ExtensionContext, commands, window, Position } from 'vscode';
import {messageItems} from './constants';
import registerCommands from './registerCommands';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

async function initSettings() {

	const sourceFiles: string[] = vscode.workspace.getConfiguration().get('scssReminder.sourceFile');

	if ((sourceFiles as string[]).length === 0) {
		const res = await vscode.window.showInformationMessage('Please select a source file containing scss variables.',
			...[messageItems.OK, messageItems.Later]);

		if (res === messageItems.OK) {
			const res = await vscode.window.showOpenDialog();
			const filePath = res[0].path;
			const relativePath = vscode.workspace.asRelativePath(filePath);
			sourceFiles.push('./' + relativePath);
			await vscode.workspace.getConfiguration().update('scssReminder.sourceFile', sourceFiles);
		}
	}
}

export async function activate(context: ExtensionContext) {
	registerCommands();
	await vscode.workspace.getConfiguration().update('scssReminder.sourceFile', []);
	vscode.commands.executeCommand('scssReminder.setSourceFile');
	console.log("activate");
	// initSettings();

	const cmds = await vscode.commands.getCommands(true);
	console.log(cmds.filter(v => {
		return v.includes('scssReminder');
	}));

	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', pattern: '**/*.{scss,sass}' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'scssReminder',
		'Language Server Reminder',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
