declare const describe: any;
declare const it: any;
declare const test: any;
declare const expect: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const beforeAll: any;
declare const afterAll: any;
declare const jest: any;

declare namespace jest {
  type Mocked<T> = T;
  type Mock<T extends (...args: any) => any> = T;
  type SpyInstance<T extends (...args: any) => any = (...args: any) => any> = {
    (...args: Parameters<T>): ReturnType<T>;
    mockImplementation(fn: T): SpyInstance<T>;
    mockResolvedValue(value: any): SpyInstance<T>;
    mockRejectedValue(value: any): SpyInstance<T>;
    mockReturnValue(value: any): SpyInstance<T>;
    mockClear(): SpyInstance<T>;
  };
}
