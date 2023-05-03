import {Block, BlockHeader} from './block.js';

const blockHeader = new BlockHeader(0);
const data = ['asdf', 'asdfs', 'asdfjsdkljf', 'asdfldk', 'sadflk'];

const block = new Block(blockHeader, data);
console.log(block);
