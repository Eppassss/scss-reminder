/**
 * @file loadMixins.ts
 * @author patrickli147
 */

 import * as fs from 'fs';

import {Position, TextDocument} from 'vscode-languageserver-textdocument';
import {scssMixinPattern} from './utils/regExp';

export interface IMixinData {
	/**
	 * mixin name
	 */
	mixinName: string,
	/**
	 * mixin content
	 */
	mixinContent: string,
	/**
	 * start position of mixin
	 */
	start: Position;
	/**
	 * end position of mixin
	 */
	end: Position;
	/**
	 * mixin full content(name & content)
	 */
	fullContent: string;
	/**
	 * uri of textDocument
	 */
	uri: string;
}

/**
 * Load mixins in source files
 *
 * @param path source file path
 * @returns return {mixins, textdocument}
 */
export default (path: string) => {
	const text = fs.readFileSync(path, 'utf-8');
	const textDocument = TextDocument.create(path.substr(1), "plaintext", 1, text);
	const mixins: Map<string, IMixinData> = new Map();

	let matches: RegExpExecArray | null;

	while ((matches = scssMixinPattern.exec(text)) !== null) {
		const matchContent = matches[0];
		const mixinName = matches[3].trim();
		const startBracketIndex = matches.index + matchContent.length;
		const mixinContent = getMixinContent(startBracketIndex, text);
		const mixinData = {
			mixinName,
			mixinContent,
			start: textDocument.positionAt(matches.index),
			end: textDocument.positionAt(startBracketIndex + mixinContent.length),
			fullContent: matchContent + mixinContent,
			uri: textDocument.uri
		};

		mixins.set(mixinName, mixinData);
	}

	return {mixins, textDocument};
};

/**
 * This function parses the mixin content with the given index of the first bracket
 *
 * @param startIndex - index of the first bracket
 * @param text - content of the file
 * @returns return mixin content string
 */
function getMixinContent(startIndex: number, text: string): string {
	const length = text.length;
	let mixinContent = '';
	const bracketStack = [];

	for (let i = startIndex; i < length; i++) {
		if (text[i] === '{') {
			bracketStack.push(text[i]);
		}
		else if (text[i] === '}') {
			bracketStack.pop();
		}

		mixinContent += text[i];

		if (bracketStack.length === 0) {
			break;
		}
	}

	return mixinContent;
}
