export class MalformedResponseError extends Error {
  response;

  constructor(message: string, response: unknown) {
    super(message);
    this.name = "MalformedResponseError";
    this.response = response;
  }
}
