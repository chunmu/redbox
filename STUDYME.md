# 一点一滴学习

##### 迭代器用法

```typescript
export class SetWithKey<T> implements Set<T> {
	private _map = new Map<any, T>();

	*values(): IterableIterator<T> {
		for (const entry of this._map.values()) {
			yield entry;
		}
	}

	// 迭代器用法学习
	[Symbol.iterator](): IterableIterator<T> {
		return this.values();
	}

}

// 例1
const array1 = ["a", "b", "c"];
const iterator1 = array1[Symbol.iterator]();

for (const value of iterator1) {
  console.log(value);
}

// Expected output: "a"
// Expected output: "b"
// Expected output: "c"

// 例2
*[Symbol.iterator] () {}

var NumbersFromOne = {
  [Symbol.iterator]: function* () {
    for (let i = 1;; ++i) yield i;
  }
};

```

##### electron app CommandLine

```typescript
// CommandLine命令行是给内核Chromium设定启动参数的
app.commandLine.appendSwitch(argvKey, argvValue);

```

##### 垃圾回收 GC回收时的回调 FinalizationRegistry

```typescript
let obj = {name:"小余",age:20}

//当被GC(垃圾回收)的时候就会调用这里面的回调函数
const finalRegistry = new FinalizationRegistry(()=>{
  console.log("某一个对象被回收了 ");
})

//调用register(寄存器)进行注册任何我们想要清理回调的对象
finalRegistry.register(obj)//此时不会生效
//置为空，让obj在下轮中被垃圾回收掉
obj = null
//因为GC不是马上就回收的，它会在CPU空闲的时候进行回收，所以在一定间隔之后就会进行回收处理，然后触发我们的回调

```

##### 类型声明和常量可以同名

```typescript

// 变量和interface可同名
interface ILanguageService
export const ILanguageService = createDecorator<ILanguageService>('languageService');

```

##### IOC简单示例

```typescript

import { Container, injectable, inject } from "inversify";

@injectable()
class Developer {
    // 这里就标记了 Developer 所需的依赖: vscode对象
    // 到时候由框架创建一个, 然后传进来就行, 编写 Developer 类的同学则完全不需要考虑
    // 也无需 import 任何特定的 vscode 实现, 做到了与 vscode 完全解耦
    @inject("VSCODE")
    private vscode: VSCODE;

    work: () {
        this.vscode.open()
        // searching code...
        this.vscode.run('ctrl + v', code)
    }
}

// 这里可能由某个负责其他插件的同学来实现 vscode
@injectable()
class VSCODE {
    run: () {
        // do ...
    }
}

// 注册阶段
var container = new Container();
container.bind<Developer>('Developer').to(Developer);
container.bind<VSCODE>('VSCODE').to(VSCODE);

// 用户真正使用的时候
const developer = Container.get('Developer')  // 大致等同于 new Developer()
// 此时Container 根据之前扫描出的依赖图, 已经知道 developer 需要一个 vscode 依赖,
// ioc框架会自动 new 一个Vscode对象然后帮你设置进 developer
// 而你作为用户, 这一切都是无感的, very nice

```

##### vscode的service可以是对象，提供对象配置服务，可以是class，提供方法等服务

```typescript
		// Product service不一定是类，也可能是个对象，只要满足定义就行
		const productService = { _serviceBrand: undefined, ...product };
		services.set(IProductService, productService);

```

###### 函数计算结果缓存装饰器

```typescript
// 缓存高消耗方法计算结果的装饰器
export function memoize(_target: Object, key: string, descriptor: PropertyDescriptor) {
	let fnKey: 'value' | 'get' | null = null;
	let fn: Function | null = null;

	if (typeof descriptor.value === 'function') {
		fnKey = 'value';
		fn = descriptor.value;

		if (fn!.length !== 0) {
			console.warn('Memoize should only be used in functions with zero parameters');
		}
	} else if (typeof descriptor.get === 'function') {
		fnKey = 'get';
		fn = descriptor.get;
	}

	if (!fn) {
		throw new Error('not supported');
	}

	const memoizeKey = `$memoize$${key}`;
	descriptor[fnKey!] = function (...args: any[]) {
		if (!this.hasOwnProperty(memoizeKey)) {
			Object.defineProperty(this, memoizeKey, {
				configurable: false,
				enumerable: false,
				writable: false,
        // 如果没有缓存结果，直接执行方法，且赋值
				value: fn.apply(this, args)
			});
		}
		return (this as any)[memoizeKey];
	};
}

@memoize
get appData() {
  ...
}
```

##### 几种装饰器

```typescript
@classDecorator // 类装饰器
class Hero {
    @propertyDecorator // 属性装饰器
    name: string = "";

    @propertyDecorator
    _hp: number = 100;

    @methodDecorator // 方法装饰器
    attack(@paramDecorator enemy: Enermy /* 参数装饰器 */) {

    }

    @propertyDecorator  // 访问符装饰器
    get hp() {
        return this._hp;
    }
}

declare type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;
declare type PropertyDecorator = (target: object, propertyKey: string | symbol) => void;
declare type MethodDecorator = <T>(target:Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>)=> typedPropertyDescrriptor<T> | void;
declare type ParameterDecorator = (target: Object, propertyKey: string | symbol, parameterlndex: number) => void;

```
