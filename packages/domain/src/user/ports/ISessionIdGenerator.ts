export const SESSION_ID_GENERATOR = Symbol('SESSION_ID_GENERATOR');

export interface ISessionIdGenerator {
  generate(): string;
}
