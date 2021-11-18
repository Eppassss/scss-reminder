/**
 * @file This file contains functions used to validate
 * @author patrickli147
 */
 import {
	Diagnostic,
	DiagnosticSeverity
} from 'vscode-languageserver/node';
import {TextDocument} from 'vscode-languageserver-textdocument';
import {makeValidMixinRegExpFromString, makeValidRegExpFromString} from '../utils/regExp';
import {IMixinData} from '../loadMixins';
import {IVariableData} from '../loadVariables';

// constants
import {CSS_REMINDER} from '../constants/common';

export interface IValidateConfig {
	/**
	 * is related information supported
	 */
	hasDiagnosticRelatedInformationCapability: boolean,
	/**
	 * root uri used for related information
	 */
	rootUri: string;
}

/**
 * This function validates all mixins
 *
 * @param mixins - mixins
 * @param text - text of current file
 * @param textDocument - textDocument of current file
 * @param maxNumberOfProblems - problem count limit
 * @param config - common config of validators
 * @returns return-desc
 */
export function validateMixins(
	mixins: Map<string, IMixinData>,
	text: string,
	textDocument: TextDocument,
	maxNumberOfProblems = Infinity,
	config: IValidateConfig
) {
	const diagnostics: Diagnostic[] = [];
	let problems = 0;

	mixins.forEach((value, key) => {
		// content without outer bracket
		const mixinInnerContent = value.mixinContent.slice(1, -1).trim();
		const formattedMixinName = `@mixin ${value.mixinName}`;

		const pattern = makeValidMixinRegExpFromString(mixinInnerContent);
		let m: RegExpExecArray | null;

		while ((m = pattern.exec(text)) && problems < maxNumberOfProblems) {
			console.log('.... match');
			console.log(m);
			problems++;
			const range = {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			};

			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Information,
				range,
				message: `'${m[0]}' is defined as '${formattedMixinName}'.`,
				source: CSS_REMINDER.DIAGNOSTIC_IDENTIFIER,
				data: `@include ${value.mixinName};`
			};

			if (config.hasDiagnosticRelatedInformationCapability) {
				diagnostic.relatedInformation = [
					{
						location: {
							uri: config.rootUri + value.uri,
							range: {
								start: value.start,
								end: value.end
							}
						},
						message: value.fullContent
					}
				];
			}
			diagnostics.push(diagnostic);
		}
	});

	return diagnostics;
}

/**
 * This function validates all variables
 *
 * @param text - text of current file
 * @param textDocument - textDocument of current file
 * @param maxNumberOfProblems - problem count limit
 * @param config - common config of validators
 * @returns return-desc
 */
export function validateVariables(
	variables: Map<string, IVariableData>,
	text: string,
	textDocument: TextDocument,
	maxNumberOfProblems = Infinity,
	config: IValidateConfig
) {
	const diagnostics: Diagnostic[] = [];
	let problems = 0;

	variables.forEach((value, key) => {
		const pattern = makeValidRegExpFromString(value.value);
		const variableName = key.slice(0, -1);

		let m: RegExpExecArray | null;

		while ((m = pattern.exec(text)) && problems < maxNumberOfProblems) {
			problems++;
			const range = {
				start: textDocument.positionAt(m.index + m[1].length),
				end: textDocument.positionAt(m.index + m[0].length)
			};

			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Information,
				range,
				message: `'${m[2]}' is defined as '${variableName}'.`,
				source: CSS_REMINDER.DIAGNOSTIC_IDENTIFIER,
				data: variableName
			};

			if (config.hasDiagnosticRelatedInformationCapability) {
				diagnostic.relatedInformation = [
					{
						location: {
							uri: config.rootUri + value.uri,
							range: {
								start: value.start,
								end: value.end
							}
						},
						message: value.origin
					},
					{
						location: {
							uri: textDocument.uri,
							range: {
								start: textDocument.positionAt(m.index),
								end: textDocument.positionAt(m.index + m[0].length)
							}
						},
						message: `'${m[2]}' is defined as '${variableName}'.`
					}
				];
			}
			diagnostics.push(diagnostic);
		}
	});

	return diagnostics;
}
