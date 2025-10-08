"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPasswordHasher = void 0;
class IPasswordHasher {
    static token = Symbol('IPasswordHasher');
    static [Symbol.toStringTag] = 'IPasswordHasher';
}
exports.IPasswordHasher = IPasswordHasher;
