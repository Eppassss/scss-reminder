import { resolveCliPathFromVSCodeExecutablePath } from '@vscode/test-electron';
import * as path from 'path';
import * as vscode from 'vscode';
import { workspace, ExtensionContext, commands, window, Position } from 'vscode';
import {messageItems} from './constants';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

async function initSettings() {

	const sourceFiles: string[] = vscode.workspace.getConfiguration().get('languageServerReminder.sourceFile');

	if ((sourceFiles as string[]).length === 0) {
		const res = await vscode.window.showInformationMessage('Please select a source file containing scss variables.',
			...[messageItems.OK, messageItems.Later]);

		if (res === messageItems.OK) {
			const res = await vscode.window.showOpenDialog();
			const filePath = res[0].path;
			const relativePath = vscode.workspace.asRelativePath(filePath);
			sourceFiles.push('./' + relativePath);
			await vscode.workspace.getConfiguration().update('languageServerReminder.sourceFile', sourceFiles);
		}
	}
}

export async function activate(context: ExtensionContext) {
	// await vscode.workspace.getConfiguration().update('languageServerReminder.sourceFile', []);
	console.log("activate");
	initSettings();

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
		documentSelector: [{ scheme: 'file', pattern: '**/*.{css,scss}' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerReminder',
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
