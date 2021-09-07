import setSourceFile from './actions/setSourceFiles';
import test from './actions/test';

type CommandConfig = {
    [key in string]: (...params: any[]) => void | Promise<void>;
};

export const commandConfigs: CommandConfig = {
	'scssReminder.setSourceFile': setSourceFile,
	'scssReminder.test': test
};
