import setSourceFiles from './actions/setSourceFiles';
import test from './actions/test';

type CommandConfig = {
    [key in string]: (...params: any[]) => void | Promise<void>;
};

export const commandConfigs: CommandConfig = {
	'scssReminder.setSourceFiles': setSourceFiles,
	'scssReminder.test': test
};
