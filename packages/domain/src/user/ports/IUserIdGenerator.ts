export const USER_ID_GENERATOR = Symbol('USER_ID_GENERATOR');

export interface IUserIdGenerator {
  generate(): string;
}
