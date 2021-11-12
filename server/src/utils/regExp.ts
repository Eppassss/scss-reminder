/**
 * @file This file contains the regular expressions in need
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
