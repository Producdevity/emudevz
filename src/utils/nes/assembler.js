// TODO: Replace with actual 6502 assembler
// Mock implementation for build compatibility
const Instruction = class {};
const ParseError = class extends Error {};
const ParseLine = class {};
const ParseNode = class {};

function assemble(root) {
	return [];
}

function lineParser(line) {
	return new ParseNode();
}

function setNodeLine(line, node) {
	node.line = line;
	node.children.forEach((child) => setNodeLine(line, child));
}

export default {
	compile(asm) {
		// Mock implementation - returns empty compilation result
		// TODO: Implement actual 6502 assembly compilation
		const instructions = [];
		const bytes = new Uint8Array(0);

		return { bytes, instructions };
	},

	_parse(source) {
		// Mock implementation
		return new ParseNode();
	},
};
