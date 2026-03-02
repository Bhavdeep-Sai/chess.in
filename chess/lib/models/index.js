// This file ensures models are registered before being used in server.js
// Using .js extension so it can be imported by server.js without TypeScript compilation issues

import User from './User.ts';
import Game from './Game.ts';

export { User, Game };
