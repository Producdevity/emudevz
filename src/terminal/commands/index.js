import ChatCommand from "./ChatCommand";
import ClearCommand from "./ClearCommand";
import HelpCommand from "./HelpCommand";
import ReplCommand from "./ReplCommand";
import RootCommand from "./RootCommand";
import fsCommands from "./fs";
import MobileTestCommand from "./mobileTest";
import TestCommand from "./test/TestCommand";

export default [
	ChatCommand,
	ClearCommand,
	HelpCommand,
	ReplCommand,
	TestCommand,
	MobileTestCommand,
	...fsCommands,
	RootCommand,
];
