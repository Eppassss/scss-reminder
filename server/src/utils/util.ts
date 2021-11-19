/**
 * @file This file contains util functions
 * @author patrickli147
 */

/**
 * This function finds out whether an item is in the given array
 *
 * @param item - target item
 * @param array - source array
 * @returns true if item is in array
 */

export function isItemInArray(item: any, array: any[]): boolean {
	for (let i = 0; i < array.length; i++) {
		if (item === array[i]) {
			return true;
		}
	}

	return false;
}
