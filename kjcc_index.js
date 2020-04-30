const {JavaClassFileReader: ClassReader, Opcode, Modifier, ConstantType} = require('java-class-tools');
const BabelParser = require('@babel/parser');
const BabelNodes = require('@babel/types');
const generate = require('@babel/generator').default;
const fs = require("fs");
const Path = require("path");
const extract = require("extract-zip");
const minify = require("babel-minify");

async function compile(paths, mainClass = undefined) {

    function getOpcodeName(opcode) {
        for (let name in Opcode) if (Opcode.hasOwnProperty(name)) {
            if (Opcode[name] === opcode) return name;
        }
        throw new Error();
    }
    const nodes = [];

    function getModuleDestination(className) {
        /*if (innerClasses[className] && innerClasses[className].className !== className) {
            return BabelNodes.memberExpression(
                getModuleDestination(innerClasses[className].className),
                BabelNodes.stringLiteral(innerClasses[className].innerName),
                true
            )
        }*/
        let result = BabelNodes.identifier("MODULE");
        for (const packageName of className.split("/")) {
            result = BabelNodes.memberExpression(
                result,
                BabelNodes.stringLiteral(packageName),
                true
            )
        }
        return result;
    }

    const methodNames = {};

    function bytesToSkip(opcode) {
        switch (opcode) {
            case Opcode.AALOAD:
            case Opcode.AASTORE:
            case Opcode.ACONST_NULL:
            case Opcode.ALOAD_0:
            case Opcode.ALOAD_1:
            case Opcode.ALOAD_2:
            case Opcode.ALOAD_3:
            case Opcode.ARETURN:
            case Opcode.ARRAYLENGTH:
            case Opcode.ASTORE_0:
            case Opcode.ASTORE_1:
            case Opcode.ASTORE_2:
            case Opcode.ASTORE_3:
            case Opcode.ATHROW:
            case Opcode.BALOAD:
            case Opcode.BASTORE:
            case Opcode.BREAKPOINT:
            case Opcode.CALOAD:
            case Opcode.CASTORE:
            case Opcode.D2F:
            case Opcode.D2I:
            case Opcode.D2L:
            case Opcode.DADD:
            case Opcode.DALOAD:
            case Opcode.DASTORE:
            case Opcode.DCMPG:
            case Opcode.DCMPL:
            case Opcode.DCONST_0:
            case Opcode.DCONST_1:
            case Opcode.DDIV:
            case Opcode.DLOAD_0:
            case Opcode.DLOAD_1:
            case Opcode.DLOAD_2:
            case Opcode.DLOAD_3:
            case Opcode.DMUL:
            case Opcode.DNEG:
            case Opcode.DREM:
            case Opcode.DRETURN:
            case Opcode.DSTORE_0:
            case Opcode.DSTORE_1:
            case Opcode.DSTORE_2:
            case Opcode.DSTORE_3:
            case Opcode.DSUB:
            case Opcode.DUP:
            case Opcode.DUP_X1:
            case Opcode.DUP_X2:
            case Opcode.DUP2:
            case Opcode.DUP2_X1:
            case Opcode.DUP2_X2:
            case Opcode.F2D:
            case Opcode.F2I:
            case Opcode.F2L:
            case Opcode.FADD:
            case Opcode.FALOAD:
            case Opcode.FASTORE:
            case Opcode.FCMPG:
            case Opcode.FCMPL:
            case Opcode.FCONST_0:
            case Opcode.FCONST_1:
            case Opcode.FCONST_2:
            case Opcode.FDIV:
            case Opcode.FLOAD_0:
            case Opcode.FLOAD_1:
            case Opcode.FLOAD_2:
            case Opcode.FLOAD_3:
            case Opcode.FMUL:
            case Opcode.FNEG:
            case Opcode.FREM:
            case Opcode.FRETURN:
            case Opcode.FSTORE_0:
            case Opcode.FSTORE_1:
            case Opcode.FSTORE_2:
            case Opcode.FSTORE_3:
            case Opcode.FSUB:
            case Opcode.I2B:
            case Opcode.I2C:
            case Opcode.I2D:
            case Opcode.I2F:
            case Opcode.I2L:
            case Opcode.I2S:
            case Opcode.IADD:
            case Opcode.IALOAD:
            case Opcode.IAND:
            case Opcode.IASTORE:
            case Opcode.ICONST_M1:
            case Opcode.ICONST_0:
            case Opcode.ICONST_1:
            case Opcode.ICONST_2:
            case Opcode.ICONST_3:
            case Opcode.ICONST_4:
            case Opcode.ICONST_5:
            case Opcode.IDIV:
            case Opcode.ILOAD_0:
            case Opcode.ILOAD_1:
            case Opcode.ILOAD_2:
            case Opcode.ILOAD_3:
            case Opcode.IMPDEP1:
            case Opcode.IMPDEP2:
            case Opcode.IMUL:
            case Opcode.INEG:
            case Opcode.IOR:
            case Opcode.IREM:
            case Opcode.IRETURN:
            case Opcode.ISHL:
            case Opcode.ISHR:
            case Opcode.ISTORE_0:
            case Opcode.ISTORE_1:
            case Opcode.ISTORE_2:
            case Opcode.ISTORE_3:
            case Opcode.ISUB:
            case Opcode.IUSHR:
            case Opcode.IXOR:
            case Opcode.L2D:
            case Opcode.L2F:
            case Opcode.L2I:
            case Opcode.LADD:
            case Opcode.LALOAD:
            case Opcode.LAND:
            case Opcode.LASTORE:
            case Opcode.LCMP:
            case Opcode.LCONST_0:
            case Opcode.LCONST_1:
            case Opcode.LDIV:
            case Opcode.LLOAD_0:
            case Opcode.LLOAD_1:
            case Opcode.LLOAD_2:
            case Opcode.LLOAD_3:
            case Opcode.LMUL:
            case Opcode.LNEG:
            case Opcode.LOR:
            case Opcode.LREM:
            case Opcode.LRETURN:
            case Opcode.LSHL:
            case Opcode.LSHR:
            case Opcode.LSTORE_0:
            case Opcode.LSTORE_1:
            case Opcode.LSTORE_2:
            case Opcode.LSTORE_3:
            case Opcode.LSUB:
            case Opcode.LUSHR:
            case Opcode.LXOR:
            case Opcode.MONITORENTER:
            case Opcode.MONITOREXIT:
            case Opcode.NOP:
            case Opcode.POP:
            case Opcode.POP2:
            case Opcode.RETURN:
            case Opcode.SALOAD:
            case Opcode.SASTORE:
            case Opcode.SWAP:
                return 0;
            case Opcode.NEWARRAY:
            case Opcode.BIPUSH:
            case Opcode.ALOAD:
            case Opcode.ASTORE:
            case Opcode.DLOAD:
            case Opcode.DSTORE:
            case Opcode.FLOAD:
            case Opcode.FSTORE:
            case Opcode.ILOAD:
            case Opcode.ISTORE:
            case Opcode.LDC:
            case Opcode.LLOAD:
            case Opcode.LSTORE:
            case Opcode.RET:
                return 1;
            case Opcode.GOTO:
            case Opcode.IF_ACMPEQ:
            case Opcode.IF_ACMPNE:
            case Opcode.IF_ICMPEQ:
            case Opcode.IF_ICMPGE:
            case Opcode.IF_ICMPGT:
            case Opcode.IF_ICMPLE:
            case Opcode.IF_ICMPLT:
            case Opcode.IF_ICMPNE:
            case Opcode.IFEQ:
            case Opcode.IFGE:
            case Opcode.IFGT:
            case Opcode.IFLE:
            case Opcode.IFLT:
            case Opcode.IFNE:
            case Opcode.IFNONNULL:
            case Opcode.IFNULL:
            case Opcode.JSR:
            case Opcode.SIPUSH:
            case Opcode.IINC:
            case Opcode.ANEWARRAY:
            case Opcode.CHECKCAST:
            case Opcode.GETFIELD:
            case Opcode.GETSTATIC:
            case Opcode.INSTANCEOF:
            case Opcode.INVOKESPECIAL:
            case Opcode.INVOKESTATIC:
            case Opcode.INVOKEVIRTUAL:
            case Opcode.LDC_W:
            case Opcode.LDC2_W:
            case Opcode.NEW:
            case Opcode.PUTFIELD:
            case Opcode.PUTSTATIC:
                return 2;
            case Opcode.MULTIANEWARRAY:
            case Opcode.WIDE:
                return 3;
            case Opcode.GOTO_W:
            case Opcode.JSR_W:
            case Opcode.INVOKEDYNAMIC:
            case Opcode.INVOKEINTERFACE:
                return 4;
            default:
                throw new Error(getOpcodeName(opcode));
        }
    }

    expandPackages("java/lang/Object");
    nodes.push(
        BabelParser.parseExpression("MODULE[\"java\"][\"lang\"][\"Object\"] = function(){}")
    );

    const clinits = [];

    function compileClassFile(path) {
        return new Promise((resolve, reject) => {
            let requiredModules = [];

            function addRequiredModules(...arguments) {
                for (const arg of arguments) {
                    if (!(arg in requiredModules)) requiredModules.push(arg);
                }
            }

            let varCount = 0;

            function createVarName() {
                return `var${varCount++}`;
            }

            const result = readingResults[path] || new ClassReader().read(path);
            const string = index => String.fromCharCode(...result.constant_pool[index].bytes);


            function parseDescriptor(descriptor) {
                let index = 0;
                let params = null;

                function nextChar() {
                    return descriptor[index];
                }

                function consumeChar() {
                    const result = descriptor[index++];
                    if (typeof result === "undefined") throw new Error("Expected input");
                    return result;
                }

                function parseType() {
                    const char = consumeChar();
                    if (["Z", "B", "C", "D", "F", "I", "J", "S", "V"].indexOf(char) !== -1) {
                        return char;
                    } else if (char === "L") {
                        let param = "";
                        while (nextChar() !== ";") param += consumeChar();
                        return param + consumeChar();
                    } else if (char === "[") {
                        return "[" + parseType();
                    } else throw new Error(char);
                }

                if (nextChar() === "(") {
                    consumeChar();
                    params = [];
                    while (nextChar() !== ")") {
                        params.push(parseType());
                    }
                    if (consumeChar() !== ")") throw new Error("wtf");
                }
                return {params, returnType: parseType()};
            }

            function methodToFunction(method) {
                const name = string(method.name_index);
                //if (name === "<init>") return constructorToFunction(method);

                const statements = [];
                statements.push(BabelNodes.variableDeclaration("const", [
                    BabelNodes.variableDeclarator(
                        BabelNodes.identifier("__vars"),
                        BabelNodes.arrayExpression(
                            [].concat(
                                method.access_flags & Modifier.STATIC ? [] : BabelNodes.thisExpression(),
                                BabelNodes.spreadElement(BabelNodes.identifier("arguments"))
                            )
                        ))
                ]));
                if (method.access_flags & Modifier.ABSTRACT) {
                    return `function() { throw new Error("Abstract method called") }`
                } else if (method.access_flags & Modifier.NATIVE) {
                    const fullDescriptor = `${className}.${string(method.name_index)}${string(method.descriptor_index)}`;
                    return `function() {
                        return (GLOBAL.implementation("${fullDescriptor}") || (()=>{throw new Error("Native method '${fullDescriptor}' is not implemented")})())(arguments);
                    }`
                }

                const codeAttribute = method.attributes.find(attribute => string(attribute.attribute_name_index) === "Code");
                const code = codeAttribute.code;

                function opcodeIsGoto(opcode) {
                    switch (opcode) {
                        case Opcode.IFEQ:
                        case Opcode.IFNE:
                        case Opcode.IFGE:
                        case Opcode.IFGT:
                        case Opcode.IFLE:
                        case Opcode.IFLT:
                        case Opcode.IFNONNULL:
                        case Opcode.IFNULL:
                        case Opcode.IF_ACMPEQ:
                        case Opcode.IF_ICMPEQ:
                        case Opcode.IF_ACMPNE:
                        case Opcode.IF_ICMPNE:
                        case Opcode.IF_ICMPGT:
                        case Opcode.IF_ICMPLT:
                        case Opcode.IF_ICMPGE:
                        case Opcode.IF_ICMPLE:
                        case Opcode.GOTO:
                        case Opcode.GOTO_W:
                            return true;
                        default:
                            return false;
                    }
                }

                function toSignedShort(v) {
                    return v > 32768 ? v - 2*32768 : v;
                }

                let labels = [];
                let indexOuter = 0;
                function nextByteOuter(k = 0) {
                    return code[indexOuter + k];
                }

                function consumeByteOuter() {
                    const result = code[indexOuter];
                    indexOuter++;
                    if (typeof result === "undefined") throw new Error("Unexpected end of input");
                    return result;
                }

                while (typeof nextByteOuter() !== "undefined") {
                    function _getInt() {
                        let result = consumeByteOuter() << 24;
                        result |= consumeByteOuter() << 16;
                        result |= consumeByteOuter() << 8;
                        result |= consumeByteOuter();
                        if (result >= 2147483648) result = result - 2147483648*2;
                        return result;
                    }
                    if (opcodeIsGoto(nextByteOuter())) {
                        let thisIdx = indexOuter;
                        consumeByteOuter();
                        let byte1 = consumeByteOuter(), byte2 = consumeByteOuter();
                        let v = toSignedShort((byte1 << 8) + byte2);
                        labels.push(v + thisIdx);
                    } else if (nextByteOuter() === Opcode.LOOKUPSWITCH) {
                        let thisIdx = indexOuter;
                        consumeByteOuter();
                        while (indexOuter % 4) consumeByteOuter();

                        labels.push(_getInt() + thisIdx);
                        let numPairs = _getInt();
                        for (let j = 0; j < numPairs; j++) {
                            _getInt();
                            labels.push(_getInt() + thisIdx);
                        }
                    } else {
                        let opcode = consumeByteOuter();
                        indexOuter += bytesToSkip(opcode);
                    }
                }
                labels = labels.filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
                const blocks = [];
                let id = 0;
                for (let i = 0; i < labels.length; i++) {
                    blocks.push(code.slice(id, labels[i]));
                    id = labels[i];
                }
                blocks.push(code.slice(id));

                for (let __i = 0; __i < blocks.length; __i++) {
                    const block = blocks[__i];
                    const currentStatements = [];
                    let currentStack = [];
                    for (let i = 0; i < 10; i++) {
                        currentStack.push(
                            BabelNodes.memberExpression(
                                BabelNodes.identifier("arguments"),
                                BabelNodes.numericLiteral(9 - i),
                                true
                            )
                        );
                    }


                    let index = 0;

                    function nextByte(k = 0) {
                        return block[index + k];
                    }

                    function consumeByte() {
                        const result = block[index++];
                        if (typeof result === "undefined") throw new Error("Unexpected end of input");
                        return result;
                    }

                    function getInt() {
                        return consumeByte() << 24 | consumeByte() << 16 | consumeByte() << 8 | consumeByte();
                    }

                    function popStack() {
                        if (currentStack.length < 1) throw new Error(`Cannot pop stack`);
                        return currentStack.pop();
                    }

                    function parseMethodOrFieldRef() {
                        const ref = result.constant_pool[consumeByte() * 256 + consumeByte()];
                        const className = string(result.constant_pool[ref.class_index].name_index);
                        const name = string(result.constant_pool[ref.name_and_type_index].name_index);
                        const descriptor = string(result.constant_pool[ref.name_and_type_index].descriptor_index);
                        const parsed = parseDescriptor(descriptor);
                        return {ref: ref, className, name, descriptor, parsed};
                    }

                    function jmpToCondition(opcode) {
                        switch (opcode) {
                            case Opcode.IFEQ:
                                return (BabelNodes.binaryExpression("===", popStack(currentStack), BabelNodes.numericLiteral(0)));
                            case Opcode.IFNE:
                                return (BabelNodes.binaryExpression("!==", popStack(currentStack), BabelNodes.numericLiteral(0)));
                            case Opcode.IFGE:
                                return (BabelNodes.binaryExpression(">=", popStack(currentStack), BabelNodes.numericLiteral(0)));
                            case Opcode.IFGT:
                                return (BabelNodes.binaryExpression(">", popStack(currentStack), BabelNodes.numericLiteral(0)));
                            case Opcode.IFLE:
                                return (BabelNodes.binaryExpression("<=", popStack(currentStack), BabelNodes.numericLiteral(0)));
                            case Opcode.IFLT:
                                return (BabelNodes.binaryExpression("<", popStack(currentStack), BabelNodes.numericLiteral(0)));
                            case Opcode.IFNONNULL:
                                return (BabelNodes.binaryExpression("!==", popStack(currentStack), BabelNodes.nullLiteral()));
                            case Opcode.IFNULL:
                                return (BabelNodes.binaryExpression("===", popStack(currentStack), BabelNodes.nullLiteral()));
                            case Opcode.IF_ACMPEQ:
                            case Opcode.IF_ICMPEQ:
                                return (BabelNodes.binaryExpression("===", popStack(currentStack), popStack(currentStack)));
                            case Opcode.IF_ACMPNE:
                            case Opcode.IF_ICMPNE:
                                return (BabelNodes.binaryExpression("!==", popStack(currentStack), popStack(currentStack)));
                            case Opcode.IF_ICMPGT:
                                return (BabelNodes.binaryExpression("<", popStack(currentStack), popStack(currentStack)));
                            case Opcode.IF_ICMPLT:
                                return (BabelNodes.binaryExpression(">", popStack(currentStack), popStack(currentStack)));
                            case Opcode.IF_ICMPGE:
                                return (BabelNodes.binaryExpression("<=", popStack(currentStack), popStack(currentStack)));
                            case Opcode.IF_ICMPLE:
                                return (BabelNodes.binaryExpression(">=", popStack(currentStack), popStack(currentStack)));
                            case Opcode.GOTO:
                                return (BabelNodes.booleanLiteral(true));
                            default:
                                throw new Error(opcode);
                        }
                    }

                    function parseLDC(__idx) {
                        (() => {
                            const constant = result.constant_pool[__idx];
                            if (constant.tag === ConstantType.STRING) {
                                currentStack.push(
                                    BabelNodes.stringLiteral(
                                        string(constant.string_index)
                                    )
                                );
                            } else if (constant.tag === ConstantType.INTEGER) {
                                currentStack.push(
                                    BabelNodes.numericLiteral(
                                        constant.bytes
                                    )
                                )
                            } else if (constant.tag === ConstantType.FLOAT) {
                                const buf = new ArrayBuffer(4);
                                const view = new DataView(buf);
                                [
                                    constant.bytes >> 24,
                                    constant.bytes >> 16 & 0xFF,
                                    constant.bytes >> 8 & 0xFF,
                                    constant.bytes & 0xFF
                                ].forEach(function (b, i) {
                                    view.setUint8(i, b);
                                });
                                const num = view.getFloat32(0);
                                currentStack.push(
                                    BabelNodes.numericLiteral(num)
                                )
                            } else if (constant.tag === ConstantType.CLASS) {
                                addRequiredModules("getclass");
                                currentStack.push(BabelNodes.callExpression(BabelNodes.identifier("__getclass"), [
                                    BabelNodes.stringLiteral(string(constant.name_index))
                                ]));
                            } else throw new Error(`Bad LDC (${constant.tag})`);
                        })();
                    }

                    function generateGoto(dest) {
                        const idx = labels.indexOf(dest) + 1;
                        if (idx === 0) {
                            console.log(labels);
                            console.log(labels.map(lbl => getOpcodeName(code[lbl])));
                            console.log(dest);
                            console.log(getOpcodeName(code[dest]));
                            throw new Error();
                        }
                        return generateGoto0(idx);
                    }

                    function generateGoto0(idx) {
                        let stackCopy = currentStack.map(v => v);
                        stackCopy.reverse();
                        return BabelNodes.returnStatement(
                            BabelNodes.callExpression(
                                BabelNodes.identifier("__lbl" + idx),
                                stackCopy
                            )
                        );
                    }

                    while (typeof nextByte() !== "undefined") {
                        const opcode = consumeByte();
                        switch (opcode) {
                            case Opcode.NOP:
                                console.warn(`Warning: NOP met at ${className}.${name}`);
                                break;
                            case Opcode.LOOKUPSWITCH:
                                (() => {
                                    const thisIdx = index - 1;
                                    while (index % 4) consumeByte();
                                    const defaultLabel = getInt() + thisIdx;
                                    const numPairs = getInt();
                                    const pairs = [];
                                    for (let i = 0; i < numPairs; i++) {
                                        pairs.push([getInt(), getInt()]);
                                    }
                                    const key = popStack();
                                    currentStatements.push(BabelNodes.switchStatement(key, pairs.map(pair => {
                                        return BabelNodes.switchCase(BabelNodes.numericLiteral(pair[0]), [ generateGoto(thisIdx+pair[1]) ])
                                    }).concat([ BabelNodes.switchCase(null, [ generateGoto(defaultLabel) ]) ])));
                                })();
                                break;
                            case Opcode.INSTANCEOF:
                                (() => {
                                    const value = popStack();
                                    const checkClassName = string(result.constant_pool[consumeByte() * 256 + consumeByte()].name_index);
                                    currentStack.push(BabelNodes.binaryExpression("instanceof",
                                        value,
                                        getModuleDestination(checkClassName)));
                                })();
                                break;
                            case Opcode.CHECKCAST:
                                (() => {
                                    const value = popStack();
                                    const checkClassName = string(result.constant_pool[consumeByte() * 256 + consumeByte()].name_index);
                                    addRequiredModules("checkcast");
                                    currentStack.push(BabelNodes.callExpression(BabelNodes.identifier("__checkcast"), [
                                        value,
                                        BabelNodes.stringLiteral(checkClassName)
                                    ]));
                                })();
                                break;
                            case Opcode.POP:
                                popStack();
                                break;
                            case Opcode.LCMP:
                            case Opcode.DCMPL:
                            case Opcode.FCMPL:
                                (() => {
                                    addRequiredModules("spaceship");
                                    const value2 = popStack(), value1 = popStack();
                                    currentStack.push(BabelNodes.callExpression(BabelNodes.identifier("__spaceship"), [value1, value2]));
                                })();
                                break;
                            case Opcode.FCMPG:
                            case Opcode.DCMPG:
                                (() => {
                                    addRequiredModules("spaceship");
                                    const value2 = popStack(), value1 = popStack();
                                    currentStack.push(BabelNodes.callExpression(BabelNodes.identifier("__spaceship"), [value2, value1]));
                                })();
                                break;
                            case Opcode.ILOAD:
                            case Opcode.ILOAD_0:
                            case Opcode.ILOAD_1:
                            case Opcode.ILOAD_2:
                            case Opcode.ILOAD_3:
                                (() => {
                                    let index = opcode === Opcode.ILOAD ? consumeByte() : opcode - Opcode.ILOAD_0;
                                    currentStack.push(BabelNodes.memberExpression(BabelNodes.identifier("__vars"), BabelNodes.numericLiteral(index), true));
                                })();
                                break;
                            case Opcode.LLOAD:
                            case Opcode.LLOAD_0:
                            case Opcode.LLOAD_1:
                            case Opcode.LLOAD_2:
                            case Opcode.LLOAD_3:
                                (() => {
                                    let index = opcode === Opcode.LLOAD ? consumeByte() : opcode - Opcode.LLOAD_0;
                                    currentStack.push(BabelNodes.memberExpression(BabelNodes.identifier("__vars"), BabelNodes.numericLiteral(index), true));
                                })();
                                break;
                            case Opcode.FLOAD:
                            case Opcode.FLOAD_0:
                            case Opcode.FLOAD_1:
                            case Opcode.FLOAD_2:
                            case Opcode.FLOAD_3:
                                (() => {
                                    let index = opcode === Opcode.FLOAD ? consumeByte() : opcode - Opcode.FLOAD_0;
                                    currentStack.push(BabelNodes.memberExpression(BabelNodes.identifier("__vars"), BabelNodes.numericLiteral(index), true));
                                })();
                                break;
                            case Opcode.DLOAD:
                            case Opcode.DLOAD_0:
                            case Opcode.DLOAD_1:
                            case Opcode.DLOAD_2:
                            case Opcode.DLOAD_3:
                                (() => {
                                    let index = opcode === Opcode.DLOAD ? consumeByte() : opcode - Opcode.DLOAD_0;
                                    currentStack.push(BabelNodes.memberExpression(BabelNodes.identifier("__vars"), BabelNodes.numericLiteral(index), true));
                                })();
                                break;
                            case Opcode.ALOAD:
                            case Opcode.ALOAD_0:
                            case Opcode.ALOAD_1:
                            case Opcode.ALOAD_2:
                            case Opcode.ALOAD_3:
                                (() => {
                                    let index = opcode === Opcode.ALOAD ? consumeByte() : opcode - Opcode.ALOAD_0;
                                    currentStack.push(BabelNodes.memberExpression(BabelNodes.identifier("__vars"), BabelNodes.numericLiteral(index), true));
                                })();
                                break;
                            case Opcode.IMUL:
                            case Opcode.FMUL:
                            case Opcode.LMUL:
                            case Opcode.DMUL:
                                (() => {
                                    let second = popStack(), first = popStack();
                                    currentStack.push(BabelNodes.binaryExpression("*", first, second));
                                })();
                                break;
                            case Opcode.ISUB:
                            case Opcode.FSUB:
                            case Opcode.LSUB:
                            case Opcode.DSUB:
                                (() => {
                                    let second = popStack(), first = popStack();
                                    currentStack.push(BabelNodes.binaryExpression("-", first, second));
                                })();
                                break;
                            case Opcode.IADD:
                            case Opcode.FADD:
                            case Opcode.LADD:
                            case Opcode.DADD:
                                (() => {
                                    let second = popStack(), first = popStack();
                                    currentStack.push(BabelNodes.binaryExpression("+", first, second));
                                })();
                                break;
                            case Opcode.IDIV:
                            case Opcode.FDIV:
                            case Opcode.LDIV:
                            case Opcode.DDIV:
                                (() => {
                                    let second = popStack(), first = popStack();
                                    currentStack.push(BabelNodes.binaryExpression("/", first, second));
                                })();
                                break;
                            case Opcode.IREM:
                            case Opcode.FREM:
                            case Opcode.LREM:
                            case Opcode.DREM:
                                (() => {
                                    let second = popStack(), first = popStack();
                                    currentStack.push(BabelNodes.binaryExpression("%", first, second));
                                })();
                                break;
                            case Opcode.IAND:
                            case Opcode.LAND:
                                (() => {
                                    let second = popStack(), first = popStack();
                                    currentStack.push(BabelNodes.binaryExpression("&", first, second));
                                })();
                                break;
                            case Opcode.IOR:
                            case Opcode.LOR:
                                (() => {
                                    let second = popStack(), first = popStack();
                                    currentStack.push(BabelNodes.binaryExpression("|", first, second));
                                })();
                                break;
                            case Opcode.IXOR:
                            case Opcode.LXOR:
                                (() => {
                                    let second = popStack(), first = popStack();
                                    currentStack.push(BabelNodes.binaryExpression("^", first, second));
                                })();
                                break;
                            case Opcode.ISHL:
                            case Opcode.LSHL:
                                (() => {
                                    let second = popStack(), first = popStack();
                                    currentStack.push(BabelNodes.binaryExpression("<<", first, second));
                                })();
                                break;
                            case Opcode.ISHR:
                            case Opcode.LSHR:
                                (() => {
                                    let second = popStack(), first = popStack();
                                    currentStack.push(BabelNodes.binaryExpression(">>", first, second));
                                })();
                                break;
                            case Opcode.IUSHR:
                            case Opcode.LUSHR:
                                (() => {
                                    let second = popStack(), first = popStack();
                                    currentStack.push(BabelNodes.binaryExpression(">>>", first, second));
                                })();
                                break;
                            case Opcode.I2B:
                            case Opcode.I2C:
                            case Opcode.I2L:
                            case Opcode.I2F:
                            case Opcode.I2D:
                            case Opcode.I2S:
                            case Opcode.L2D:
                            case Opcode.L2I:
                            case Opcode.L2F:
                            case Opcode.F2D:
                            case Opcode.F2I:
                            case Opcode.F2L:
                            case Opcode.D2L:
                            case Opcode.D2I:
                            case Opcode.D2F:
                                break;
                            case Opcode.INEG:
                            case Opcode.FNEG:
                            case Opcode.LNEG:
                            case Opcode.DNEG:
                                currentStack.push(BabelNodes.unaryExpression("-", popStack()));
                                break;
                            case Opcode.RETURN:
                            case Opcode.ARETURN:
                            case Opcode.IRETURN:
                            case Opcode.FRETURN:
                            case Opcode.LRETURN:
                            case Opcode.DRETURN:
                                (() => {
                                    let value = opcode === Opcode.RETURN ? undefined : popStack();
                                    currentStatements.push(BabelNodes.returnStatement(value))
                                })();
                                break;
                            case Opcode.INVOKESTATIC:
                                (() => {
                                    const {parsed, name, className, descriptor} = parseMethodOrFieldRef();
                                    const paramCount = parsed.params.length;
                                    const args = [];
                                    for (let i = 0; i < paramCount; i++) args.push(popStack());
                                    let finalName;
                                    if (methodNames[className]) {
                                        finalName = methodNames[className][name + descriptor];
                                    } else {
                                        console.warn(`Class ${className} is not defined, using default names`);
                                        finalName = name;
                                    }
                                    const gen = BabelNodes.callExpression(
                                        BabelNodes.memberExpression(
                                            getModuleDestination(className),
                                            BabelNodes.stringLiteral(finalName),
                                            true
                                        ),
                                        args.reverse()
                                    );
                                    if (parsed.returnType === "V") {
                                        currentStatements.push(BabelNodes.expressionStatement(gen))
                                    } else currentStack.push(gen);
                                })();
                                break;
                            case Opcode.INVOKEINTERFACE:
                            case Opcode.INVOKEVIRTUAL:
                                (() => {
                                    const {parsed, name, className, descriptor} = parseMethodOrFieldRef();
                                    if (opcode === Opcode.INVOKEINTERFACE) {
                                        consumeByte();
                                        consumeByte()
                                    }
                                    const paramCount = parsed.params.length;
                                    const args = [];
                                    for (let i = 0; i < paramCount; i++) args.push(popStack());
                                    const thiz = popStack();
                                    let finalName;
                                    if (methodNames[className]) {
                                        finalName = methodNames[className][name + descriptor];
                                    } else {
                                        console.warn(`Class ${className} is not defined, using default names`);
                                        finalName = name;
                                    }
                                    const gen = BabelNodes.callExpression(
                                        BabelNodes.memberExpression(thiz, BabelNodes.identifier(finalName)),
                                        args.reverse()
                                    );
                                    if (parsed.returnType === "V") {
                                        currentStatements.push(BabelNodes.expressionStatement(gen))
                                    } else currentStack.push(gen);
                                })();
                                break;
                            case Opcode.ICONST_M1:
                            case Opcode.ICONST_0:
                            case Opcode.ICONST_1:
                            case Opcode.ICONST_2:
                            case Opcode.ICONST_3:
                            case Opcode.ICONST_4:
                            case Opcode.ICONST_5:
                                currentStack.push(BabelNodes.numericLiteral(opcode - Opcode.ICONST_0));
                                break;
                            case Opcode.LCONST_0:
                            case Opcode.LCONST_1:
                                currentStack.push(BabelNodes.numericLiteral(opcode - Opcode.LCONST_0));
                                break;
                            case Opcode.FCONST_0:
                            case Opcode.FCONST_1:
                            case Opcode.FCONST_2:
                                currentStack.push(BabelNodes.numericLiteral(opcode - Opcode.FCONST_0));
                                break;
                            case Opcode.DCONST_0:
                            case Opcode.DCONST_1:
                                currentStack.push(BabelNodes.numericLiteral(opcode - Opcode.DCONST_0));
                                break;
                            case Opcode.BIPUSH:
                                currentStack.push(BabelNodes.numericLiteral(consumeByte()));
                                break;
                            case Opcode.SIPUSH:
                                currentStack.push(BabelNodes.numericLiteral(consumeByte() * 256 + consumeByte()));
                                break;
                            case Opcode.NEW:
                                (() => {
                                    const idx = consumeByte() * 256 + consumeByte();
                                    const className = string(result.constant_pool[idx].name_index);
                                    currentStack.push(BabelNodes.callExpression(
                                        BabelParser.parseExpression("Object.setPrototypeOf"),
                                        [
                                            BabelNodes.objectExpression([]),
                                            BabelNodes.memberExpression(
                                                getModuleDestination(className),
                                                BabelNodes.identifier("prototype")
                                            )
                                        ]
                                    ));
                                })();
                                break;
                            case Opcode.DUP:
                                (() => {
                                    const value = popStack();
                                    if (BabelNodes.isIdentifier(value)) {
                                        currentStack.push(value);
                                        currentStack.push(value);
                                        return;
                                    }
                                    const varName = createVarName();
                                    currentStatements.push(BabelNodes.variableDeclaration("const", [BabelNodes.variableDeclarator(
                                        BabelNodes.identifier(varName),
                                        value
                                    )]));
                                    currentStack.push(BabelNodes.identifier(varName));
                                    currentStack.push(BabelNodes.identifier(varName));
                                })();
                                break;
                            case Opcode.INVOKESPECIAL:
                                (() => {
                                    const {parsed: {params: {length: paramLength}}, descriptor, className} = parseMethodOrFieldRef();
                                    const args = [];
                                    for (let i = 0; i < paramLength; i++) args.push(currentStack.pop());
                                    const value = popStack();
                                    let constr = getModuleDestination(className);
                                    if (typeof methodNames[className] !== "undefined") {
                                        if (methodNames[className]["<init>" + descriptor] !== "<init>") {
                                            constr = BabelNodes.memberExpression(
                                                constr,
                                                BabelNodes.stringLiteral(methodNames[className]["<init>" + descriptor]),
                                                true
                                            );
                                        }
                                    } else {
                                        console.warn(`Undefined class ${className}, using default constructor`);
                                    }
                                    currentStatements.push(
                                        BabelNodes.expressionStatement(BabelNodes.callExpression(
                                            BabelNodes.memberExpression(
                                                constr,
                                                BabelNodes.identifier("apply")
                                            ),
                                            [value, BabelNodes.arrayExpression(args.reverse())]
                                        ))
                                    );
                                })();
                                break;
                            case Opcode.ASTORE:
                            case Opcode.ASTORE_0:
                            case Opcode.ASTORE_1:
                            case Opcode.ASTORE_2:
                            case Opcode.ASTORE_3:
                                (() => {
                                    let index = opcode === Opcode.ASTORE ? consumeByte() : opcode - Opcode.ASTORE_0;
                                    currentStatements.push(
                                        BabelNodes.expressionStatement(BabelNodes.assignmentExpression(
                                            "=",
                                            BabelNodes.memberExpression(BabelNodes.identifier("__vars"), BabelNodes.numericLiteral(index), true),
                                            popStack()
                                        ))
                                    );
                                })();
                                break;
                            case Opcode.LSTORE:
                            case Opcode.LSTORE_0:
                            case Opcode.LSTORE_1:
                            case Opcode.LSTORE_2:
                            case Opcode.LSTORE_3:
                                (() => {
                                    let index = opcode === Opcode.LSTORE ? consumeByte() : opcode - Opcode.LSTORE_0;
                                    currentStatements.push(
                                        BabelNodes.expressionStatement(BabelNodes.assignmentExpression(
                                            "=",
                                            BabelNodes.memberExpression(BabelNodes.identifier("__vars"), BabelNodes.numericLiteral(index), true),
                                            popStack()
                                        ))
                                    );
                                })();
                                break;
                            case Opcode.FSTORE:
                            case Opcode.FSTORE_0:
                            case Opcode.FSTORE_1:
                            case Opcode.FSTORE_2:
                            case Opcode.FSTORE_3:
                                (() => {
                                    let index = opcode === Opcode.FSTORE ? consumeByte() : opcode - Opcode.FSTORE_0;
                                    currentStatements.push(
                                        BabelNodes.expressionStatement(BabelNodes.assignmentExpression(
                                            "=",
                                            BabelNodes.memberExpression(BabelNodes.identifier("__vars"), BabelNodes.numericLiteral(index), true),
                                            popStack()
                                        ))
                                    );
                                })();
                                break;
                            case Opcode.DSTORE:
                            case Opcode.DSTORE_0:
                            case Opcode.DSTORE_1:
                            case Opcode.DSTORE_2:
                            case Opcode.DSTORE_3:
                                (() => {
                                    let index = opcode === Opcode.DSTORE ? consumeByte() : opcode - Opcode.DSTORE_0;
                                    currentStatements.push(
                                        BabelNodes.expressionStatement(BabelNodes.assignmentExpression(
                                            "=",
                                            BabelNodes.memberExpression(BabelNodes.identifier("__vars"), BabelNodes.numericLiteral(index), true),
                                            popStack()
                                        ))
                                    );
                                })();
                                break;
                            case Opcode.ISTORE:
                            case Opcode.ISTORE_0:
                            case Opcode.ISTORE_1:
                            case Opcode.ISTORE_2:
                            case Opcode.ISTORE_3:
                                (() => {
                                    let index = opcode === Opcode.ISTORE ? consumeByte() : opcode - Opcode.ISTORE_0;
                                    currentStatements.push(
                                        BabelNodes.expressionStatement(BabelNodes.assignmentExpression(
                                            "=",
                                            BabelNodes.memberExpression(BabelNodes.identifier("__vars"), BabelNodes.numericLiteral(index), true),
                                            popStack()
                                        ))
                                    );
                                })();
                                break;
                            case Opcode.GETSTATIC:
                                (() => {
                                    const {name, className} = parseMethodOrFieldRef();
                                    currentStack.push(BabelNodes.memberExpression(
                                        getModuleDestination(className),
                                        BabelNodes.stringLiteral(name),
                                        true
                                    ));
                                })();
                                break;
                            case Opcode.PUTSTATIC:
                                (() => {
                                    const {name, className} = parseMethodOrFieldRef();
                                    currentStatements.push(
                                        BabelNodes.expressionStatement(BabelNodes.assignmentExpression("=",
                                            BabelNodes.memberExpression(
                                                getModuleDestination(className),
                                                BabelNodes.stringLiteral(name),
                                                true
                                            ),
                                            popStack()
                                        ))
                                    );
                                })();
                                break;
                            case Opcode.GETFIELD:
                                (() => {
                                    const {name} = parseMethodOrFieldRef();
                                    currentStack.push(BabelNodes.memberExpression(
                                        popStack(),
                                        BabelNodes.stringLiteral(name),
                                        true
                                    ));
                                })();
                                break;
                            case Opcode.PUTFIELD:
                                (() => {
                                    const {name} = parseMethodOrFieldRef();
                                    const value = popStack();
                                    const object = popStack();
                                    currentStatements.push(
                                        BabelNodes.expressionStatement(BabelNodes.assignmentExpression("=", BabelNodes.memberExpression(
                                            object,
                                            BabelNodes.stringLiteral(name),
                                            true
                                        ), value))
                                    );
                                })();
                                break;
                            case Opcode.LDC:
                                parseLDC(consumeByte());
                                break;
                            case Opcode.LDC_W:
                                parseLDC(consumeByte() * 256 + consumeByte());
                                break;
                            case Opcode.LDC2_W:
                                (() => {
                                    const constant = result.constant_pool[consumeByte() * 256 + consumeByte()];
                                    if (constant.tag === ConstantType.LONG) {
                                        currentStack.push(
                                            BabelNodes.numericLiteral(
                                                constant.high_bytes * (2 ** 32) + constant.low_bytes
                                            )
                                        )
                                    } else if (constant.tag === ConstantType.DOUBLE) {
                                        const buf = new ArrayBuffer(8);
                                        const view = new DataView(buf);
                                        [
                                            constant.high_bytes >> 24 & 0xFF,
                                            constant.high_bytes >> 16 & 0xFF,
                                            constant.high_bytes >> 8 & 0xFF,
                                            constant.high_bytes & 0xFF,
                                            constant.low_bytes >> 24 & 0xFF,
                                            constant.low_bytes >> 16 & 0xFF,
                                            constant.low_bytes >> 8 & 0xFF,
                                            constant.low_bytes & 0xFF,
                                        ].forEach(function (b, i) {
                                            view.setUint8(i, b);
                                        });
                                        const num = view.getFloat64(0);
                                        currentStack.push(
                                            BabelNodes.numericLiteral(num)
                                        )
                                    }
                                })();
                                break;
                            case Opcode.ACONST_NULL:
                                currentStack.push(BabelNodes.nullLiteral());
                                break;
                            case Opcode.ANEWARRAY:
                                consumeByte();
                            case Opcode.NEWARRAY:
                                consumeByte();
                                (() => {
                                    const count = popStack();
                                    const varName = createVarName();
                                    const counterName = createVarName();
                                    const countVar = createVarName();
                                    currentStatements.push(
                                        BabelNodes.variableDeclaration("const", [
                                            BabelNodes.variableDeclarator(
                                                BabelNodes.identifier(varName),
                                                BabelNodes.arrayExpression([])
                                            )
                                        ])
                                    );
                                    currentStatements.push(
                                        BabelNodes.forStatement(
                                            BabelNodes.variableDeclaration("let", [
                                                BabelNodes.variableDeclarator(
                                                    BabelNodes.identifier(counterName),
                                                    BabelNodes.numericLiteral(0)
                                                ),
                                                BabelNodes.variableDeclarator(
                                                    BabelNodes.identifier(countVar),
                                                    count
                                                )
                                            ]),
                                            BabelNodes.binaryExpression(
                                                "<",
                                                BabelNodes.identifier(counterName),
                                                BabelNodes.identifier(countVar),
                                            ),
                                            BabelNodes.updateExpression("++", BabelNodes.identifier(counterName)),
                                            BabelNodes.expressionStatement(
                                                BabelNodes.callExpression(
                                                    BabelNodes.memberExpression(
                                                        BabelNodes.identifier(varName),
                                                        BabelNodes.identifier("push")
                                                    ),
                                                    [opcode === Opcode.NEWARRAY ? BabelNodes.numericLiteral(0) : BabelNodes.nullLiteral()]
                                                )
                                            )
                                        )
                                    );
                                    currentStack.push(BabelNodes.identifier(varName));
                                })();
                                break;
                            case Opcode.ARRAYLENGTH:
                                currentStack.push(BabelNodes.memberExpression(popStack(), BabelNodes.identifier("length")));
                                break;
                            case Opcode.AALOAD:
                            case Opcode.IALOAD:
                            case Opcode.LALOAD:
                            case Opcode.FALOAD:
                            case Opcode.DALOAD:
                            case Opcode.CALOAD:
                            case Opcode.SALOAD:
                            case Opcode.BALOAD:
                                (() => {
                                    const index = popStack();
                                    currentStack.push(BabelNodes.memberExpression(popStack(), index, true));
                                })();
                                break;
                            case Opcode.AASTORE:
                            case Opcode.IASTORE:
                            case Opcode.LASTORE:
                            case Opcode.FASTORE:
                            case Opcode.DASTORE:
                            case Opcode.CASTORE:
                            case Opcode.SASTORE:
                            case Opcode.BASTORE:
                                (() => {
                                    const val = popStack();
                                    const index = popStack();
                                    currentStatements.push(BabelNodes.expressionStatement(
                                        BabelNodes.assignmentExpression("=", BabelNodes.memberExpression(popStack(), index, true), val)
                                    ));
                                })();
                                break;
                            case Opcode.ATHROW:
                                (() => {
                                    const val = popStack();
                                    currentStatements.push(BabelNodes.throwStatement(val));
                                    currentStack = [val];
                                })();
                                break;
                            case Opcode.IFEQ:
                            case Opcode.IFNE:
                            case Opcode.IFGE:
                            case Opcode.IFGT:
                            case Opcode.IFLE:
                            case Opcode.IFLT:
                            case Opcode.IFNONNULL:
                            case Opcode.IFNULL:
                            case Opcode.IF_ACMPEQ:
                            case Opcode.IF_ICMPEQ:
                            case Opcode.IF_ACMPNE:
                            case Opcode.IF_ICMPNE:
                            case Opcode.IF_ICMPGT:
                            case Opcode.IF_ICMPLT:
                            case Opcode.IF_ICMPGE:
                            case Opcode.IF_ICMPLE:
                            case Opcode.GOTO:
                                (() => {
                                    let offset = 0;
                                    for (let i = 0; i < __i; i++) {
                                        offset += blocks[i].length;
                                    }
                                    const dest = toSignedShort(consumeByte() * 256 + consumeByte()) + offset + index - 3;

                                    currentStatements.push(BabelNodes.ifStatement(jmpToCondition(opcode), generateGoto(dest)));
                                })();
                                break;
                            case Opcode.BREAKPOINT:
                                currentStatements.push(BabelNodes.debuggerStatement());
                                break;
                            case Opcode.IINC:
                                (() => {
                                    const idx = consumeByte();
                                    const inc = consumeByte();
                                    currentStatements.push(BabelNodes.expressionStatement(BabelNodes.assignmentExpression(
                                        "=",
                                        BabelNodes.memberExpression(BabelNodes.identifier("__vars"), BabelNodes.numericLiteral(idx), true),
                                        BabelNodes.binaryExpression(
                                            "+",
                                            BabelNodes.memberExpression(BabelNodes.identifier("__vars"), BabelNodes.numericLiteral(idx), true),
                                            BabelNodes.numericLiteral(inc)
                                        )
                                    )));
                                })();
                                break;
                            default:
                                console.log(code);
                                console.log(index - 1);
                                throw new Error(`Undefined instruction '${getOpcodeName(opcode)}' at method ${className}.${string(method.name_index)}`);
                        }
                    }

                    if (__i !== blocks.length - 1) {
                        currentStatements.push(generateGoto0(__i + 1));
                    }

                    statements.push(BabelNodes.functionDeclaration(BabelNodes.identifier("__lbl" + __i), [], BabelNodes.blockStatement(currentStatements)));
                }

                statements.push(BabelNodes.callExpression(BabelNodes.identifier("__lbl0"), []));

                const moduleStatements = [];

                for (const module of requiredModules) {
                    switch (module) {
                        case "spaceship":
                            moduleStatements.push(
                                BabelNodes.functionDeclaration(
                                    BabelNodes.identifier("__spaceship"),
                                    [BabelNodes.identifier("a"), BabelNodes.identifier("b")],
                                    BabelNodes.blockStatement([
                                        BabelNodes.returnStatement(
                                            BabelNodes.conditionalExpression(
                                                BabelNodes.binaryExpression("<", BabelNodes.identifier("a"), BabelNodes.identifier("b")),
                                                BabelNodes.numericLiteral(1),
                                                BabelNodes.conditionalExpression(
                                                    BabelNodes.binaryExpression(">", BabelNodes.identifier("a"), BabelNodes.identifier("b")),
                                                    BabelNodes.numericLiteral(-1),
                                                    BabelNodes.numericLiteral(1)
                                                )
                                            )
                                        )
                                    ])
                                )
                            );
                            break;
                        case "checkcast":
                            moduleStatements.push(
                                BabelNodes.expressionStatement(BabelParser.parseExpression(`
                                    function __checkcast(val, clazz) {
                                        if (val instanceof clazz) {
                                            return val;
                                        } else {
                                            throw new Error(\`\${value} cannot be cast to \${clazz}\`);
                                        }
                                    }
                                `))
                            );
                            break;
                        case "getclass":
                            //moduleStatements.push();
                            break;
                        default:
                            throw new Error(module);
                    }
                }

                return `function(){${generate({
                    type: "Program",
                    body: [...moduleStatements, ...statements]
                }).code}}`;
            }

            const className = string(result.constant_pool[result.this_class].name_index);
            console.log(`Compiling ${className}...`);
            const resNodes = [];
            const constructors = [];
            let clinit = false;
            const dest = getModuleDestination(className);
            for (let method of result.methods) {
                const name = string(method.name_index);
                const descriptor = string(method.descriptor_index);
                if (name === "<init>") {
                    constructors.push(method);
                    continue;
                } else if (name === "<clinit>") {
                    clinit = true;
                }
                const isStatic = method.access_flags & Modifier.STATIC;
                let f;
                try {
                    f = methodToFunction(method);
                } catch (e) {
                    console.error(`At ${className}.${name}${descriptor}:`);
                    throw e;
                }
                const methodName = methodNames[className][name + descriptor];
                if (isStatic) {
                    resNodes.push(BabelNodes.assignmentExpression("=",
                        BabelNodes.memberExpression(dest, BabelNodes.stringLiteral(methodName), true),
                        BabelParser.parseExpression(f)));
                } else {
                    resNodes.push(BabelNodes.assignmentExpression("=",
                        BabelNodes.memberExpression(
                            BabelNodes.memberExpression(dest, BabelNodes.identifier("prototype")),
                            BabelNodes.stringLiteral(methodName),
                            true),
                        BabelParser.parseExpression(f)));
                }
                console.log(`Method ${name}${descriptor} compiled`);
            }
            /*nodes.push(variableDeclaration("const", [
                BabelNodes.variableDeclarator(BabelNodes.identifier(createVarName()), dest)
            ]));*/
            nodes.push(
                BabelNodes.assignmentExpression(
                    "=",
                    dest,
                    BabelNodes.callExpression(
                        BabelParser.parseExpression("Object.assign"),
                        [
                            BabelParser.parseExpression(methodToFunction(constructors[0])),
                            BabelNodes.logicalExpression("||", dest, BabelNodes.objectExpression([])),
                        ]
                    )
                )
            );
            for (let i = 1; i < constructors.length; i++) {
                nodes.push(BabelNodes.assignmentExpression("=",
                    BabelNodes.memberExpression(dest, BabelNodes.stringLiteral("constructor_" + i), true),
                    BabelParser.parseExpression(methodToFunction(constructors[i]))));
            }
            if (clinit) clinits.push(dest);
            nodes.push(...resNodes);
            console.log(`${className} compiled`);
            resolve();
        });
    }

    const jarMap = {};

    async function compileJar(path) {
        const name = jarMap[path];
        await compileDir(name);
    }

    async function lookThroughJar(path) {
        const name = "C:\\Windows\\Temp\\__dir" + Date.now();
        jarMap[path] = name;
        console.log(`Extracting ${path}...`);
        await extract(path, {dir: name});
        console.log(`Extracted`);
        await lookThroughDir(name);
    }

    async function compileDir(path) {
        for (const childPath of fs.readdirSync(path)) {
            await compilePath(path + Path.sep + childPath, false);
        }
    }

    async function lookThroughDir(path) {
        for (const childPath of fs.readdirSync(path)) {
            await lookThroughPath(path + Path.sep + childPath, false);
        }
    }

    async function compilePath(path, strict = true) {
        const stats = fs.lstatSync(path);
        const extension = Path.extname(path);
        if (stats.isDirectory()) {
            await compileDir(path);
        } else if (stats.isFile() && extension === ".class") {
            await compileClassFile(path);
        } else if (stats.isFile() && extension === ".jar") {
            await compileJar(path);
        } else {
            if (strict) throw new Error(`Bad path '${path}'`);
        }
    }

    const readingResults = {};

    function expandPackages(className) {
        let result = BabelNodes.identifier("MODULE");
        for (const packageName of className.split("/")) {
            result = BabelNodes.memberExpression(
                result,
                BabelNodes.stringLiteral(packageName),
                true
            );
            nodes.push(BabelNodes.assignmentExpression("=", result, BabelNodes.objectExpression([])));
        }
    }

    function lookThroughClassFile(path) {
        const result = new ClassReader().read(path);
        readingResults[path] = result;
        const string = index => String.fromCharCode(...result.constant_pool[index].bytes);
        const className = string(result.constant_pool[result.this_class].name_index);
        console.log(`Looking through ${className}`);
        for (const attribute of result.attributes) {
            /*if (string(attribute.attribute_name_index) === "InnerClasses") {
                for (const { inner_class_info_index, inner_name_index } of attribute.classes) {
                    const innerName = string(result.constant_pool[inner_class_info_index].name_index);
                    if (className !== mainClass) {
                        innerClasses[innerName] = {className, innerName: inner_name_index ? string(inner_name_index) : "AnonymousInner"};
                    }
                }
            }*/
        }
        expandPackages(className);

        let constructors = 0;
        methodNames[className] = {};
        for (const method of result.methods) {
            const name = string(method.name_index);
            const descriptor = string(method.descriptor_index);
            const fullDescriptor = name + descriptor;
            if (Object.values(methodNames[className]).indexOf(name) !== -1 || method.access_flags & Modifier.PRIVATE) {
                let salt = Buffer.from(descriptor).toString("base64");
                if (salt.length > 5) salt = salt.substring(0, 5);
                let result = name + "_" + salt;
                while (result.indexOf("=") !== -1) result = result.replace("=", "_");
                methodNames[className][fullDescriptor] = name === "<init>" ? "constructor_" + ++constructors : result;
            } else {
                methodNames[className][fullDescriptor] = name;
            }
        }
        //console.log(methodNames[className]);
        console.log(`Looked through ${className}`)
    }

    async function lookThroughPath(path, strict = true) {
        const stats = fs.lstatSync(path);
        const extension = Path.extname(path);
        if (stats.isDirectory()) {
            await lookThroughDir(path);
        } else if (stats.isFile() && extension === ".class") {
            await lookThroughClassFile(path);
        } else if (stats.isFile() && extension === ".jar") {
            await lookThroughJar(path);
        } else {
            if (strict) throw new Error(`Bad path '${path}'`);
        }
    }

    for (const path of paths) {
        if (!fs.existsSync(path)) throw new Error(`Path "${path}" does not exist`);
        await lookThroughPath(path);
    }

    for (const path of paths) {
        await compilePath(path);
    }

    for (const val of clinits) {
        nodes.push(
            BabelNodes.callExpression(
                BabelNodes.memberExpression(
                    val,
                    BabelNodes.stringLiteral("<clinit>"),
                    true
                ), []
            )
        )
    }

    if (mainClass) {
        nodes.push(
            BabelNodes.callExpression(
                BabelNodes.memberExpression(
                    BabelNodes.memberExpression(
                        BabelNodes.identifier("MODULE"),
                        BabelNodes.stringLiteral(mainClass),
                        true
                    ),
                    BabelNodes.identifier("main")
                ),
                [
                    BabelNodes.arrayExpression([])
                ]
            )
        )
    }

    return (`((MODULE, GLOBAL)=>{\n${generate({
        type: "Program",
        body: nodes
    }, {}).code}\n})((window||global).kjcc={},window||global)`)
}

module.exports = {
    compile
};