/**
 * @file This file contains the regular expressions and related helper functions
 * @author patrickli147
 */

/**
 * scss/sass variable pattern
 */
export const scssVariablePattern = /(\$[\w-]+:)(\s)*([^;\n$]*)/g;

/**
 * scss/sass mixin pattern
 */
// TODO: mixin变量替换 e.g. makeFlex
export const scssMixinPattern = /(@mixin)(\s)*([^{]+)/g;

/**
 * scss/sass/css property pattern
 */
export const propertyPattern = /([\w-]+:)(\s)*([^;\n$]*)/g;

/**
 * create a RegExp to match mixins
 * @param s given string
 * @returns regular expression
 */
export function makeValidMixinRegExpFromString(s: string) {
	const reg = /[\^$.*+?|\\/[\]{}()]/g;
	s = s.replace(reg, (match: string): string => {
		return `\\${match}`;
	});

	return new RegExp(s, "g");
}

/**
 * create a RegExp to match css values
 * @param s given string
 * @returns regular expression
 */
export function makeValidRegExpFromString(s: string) {
	const reg = /[\^$.*+?|\\/[\]{}()]/g;
	s = s.replace(reg, (match: string): string => {
		return `\\${match}`;
	});

	s = '(:\\s*)(' + s + ')';

	return new RegExp(s, "g");
}

