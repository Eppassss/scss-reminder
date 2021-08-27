import * as fs from 'fs';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

// TODO:监听保存变量的文件的变化

export interface IVariableData {
	start: number;
	end: number;
	value: string;
	origin: string;
}

export default (path: string) => {
	// console.log(path);
	// console.log(__dirname);
	const text = fs.readFileSync(path, 'utf-8');
	const cssTextDocument = TextDocument.create(path, "plaintext", 1, text);
	const pattern = /(\$[\w-]+:)(\s)*([^;\n$]*)/g;
	const variables: Map<string, IVariableData> = new Map();

	let matches: RegExpExecArray | null;

	while ((matches = pattern.exec(text)) !== null) {
		const variableName = matches[1];
		const variableValue = matches[3];
		const variableData = {
			start: matches.index,
			end: matches.index + matches[0].length,
			value: variableValue,
			origin: matches[0]
		};
		// console.log(JSON.stringify(variableData));
		variables.set(variableName, variableData);
	}
	return {variables, cssTextDocument};
};
