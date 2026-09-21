// ============================================================
// Java 全栈面试题库 - 多邻国风格
// 每个模块拆成多个小关卡，按难度递增，降低单关压力
// 答案设计原则：口诀化、类比化、一句话抓重点，便于"易吸收"
// ============================================================

const QUESTION_BANK = [
  // ==================== 模块1：Java 基础 & 集合 ====================
  {
    module: "Java基础&集合",
    icon: "☕",
    color: "#58CC02",
    lessons: [
      {
        id: "java-base-1",
        title: "String 不可变",
        questions: [
          {
            type: "flashcard",
            q: "String 为什么不可变？",
            a: "1) final 类 + final char[] 数组，无setter\n2) 不可变才能做字符串常量池，节省内存\n3) 线程安全，可作HashMap的key",
            tip: "final + 无修改方法 = 不可变"
          },
          {
            type: "flashcard",
            q: "String、StringBuilder、StringBuffer 区别？",
            a: "String：不可变，拼接产生新对象。\nStringBuilder：可变，非线程安全，性能好。\nStringBuffer：可变，synchronized线程安全，稍慢。\n循环拼接用 StringBuilder。",
            tip: "单线程Builder，多线程Buffer"
          }
        ]
      },
      {
        id: "java-base-2",
        title: "集合框架概览",
        questions: [
          {
            type: "flashcard",
            q: "List、Set、Map 的区别？",
            a: "List：有序可重复。\nSet：无序不重复。\nMap：键值对，key不重复。\nSet 底层其实是用 Map 存的(只存key)。",
            tip: "List有序重复，Set无序唯一，Map键值对"
          },
          {
            type: "flashcard",
            q: "ArrayList vs LinkedList 区别？",
            a: "ArrayList：数组实现，随机访问O(1)，增删慢(要搬移)。\nLinkedList：双向链表，增删O(1)，访问O(n)。\n实际开发 ArrayList 用得多(CPU缓存友好)。",
            tip: "查多ArrayList，改多LinkedList"
          },
          {
            type: "choice",
            q: "ArrayList 扩容机制是扩容到原来的几倍？",
            options: ["1.5倍", "2倍", "3倍", "固定10"],
            answer: 0,
            tip: "oldCapacity + (oldCapacity >> 1) = 1.5倍"
          }
        ]
      },
      {
        id: "java-coll-1",
        title: "HashMap 底层",
        questions: [
          {
            type: "flashcard",
            q: "HashMap 底层数据结构是什么？",
            a: "JDK1.8 后 = 数组 + 链表 + 红黑树。\n数组是主体(桶)，hash冲突时挂链表，链表长度>8且数组长度≥64时转红黑树。",
            tip: "记：数组当货架，冲突串成链，太长变红黑树"
          },
          {
            type: "choice",
            q: "HashMap 默认初始容量是多少？",
            options: ["8", "16", "32", "64"],
            answer: 1,
            tip: "默认16，负载因子0.75，扩容翻倍"
          },
          {
            type: "flashcard",
            q: "HashMap 的 hash 函数为什么要右移16位异或？",
            a: "让高16位也参与运算，减少 hash 碰撞。\n公式：(h = key.hashCode()) ^ (h >>> 16)",
            tip: "高16位^低16位，打散更均匀"
          }
        ]
      },
      {
        id: "java-coll-2",
        title: "HashMap 进阶",
        questions: [
          {
            type: "flashcard",
            q: "HashMap 为什么线程不安全？",
            a: "多线程同时 put 可能导致：1)数据覆盖 2)1.7头插法成环死循环 3)size计算不准。\n并发场景用 ConcurrentHashMap。",
            tip: "put无锁，互相覆盖；1.7还会成环"
          },
          {
            type: "flashcard",
            q: "equals 和 hashCode 的关系？",
            a: "1) equals 相等 → hashCode 必须相等\n2) hashCode 相等 → equals 不一定相等(哈希冲突)\n重写 equals 必须重写 hashCode，否则 HashMap 找不到。",
            tip: "相等必同码，同码未必等"
          },
          {
            type: "flashcard",
            q: "fail-fast 和 fail-safe 区别？",
            a: "fail-fast：遍历时集合被修改(modCount变化)立刻抛异常，ArrayList/HashMap都是。\nfail-safe：遍历副本，修改不影响遍历，ConcurrentHashMap、CopyOnWriteArrayList。",
            tip: "fail-fast抛异常，fail-safe读副本"
          },
          {
            type: "flashcard",
            q: "TreeMap 和 HashMap 区别？",
            a: "HashMap：哈希表，O(1)，无序。\nTreeMap：红黑树，O(logN)，key有序。\n需要排序用 TreeMap。",
            tip: "要快用HashMap，要序用TreeMap"
          }
        ]
      },
      {
        id: "java-coll-3",
        title: "泛型原理",
        questions: [
          {
            type: "choice",
            q: "Java 泛型的本质是？",
            options: ["运行时类型检查", "编译期擦除", "动态代理", "反射"],
            answer: 1,
            tip: "Type Erasure 类型擦除，运行时都是Object"
          }
        ]
      }
    ]
  },

  // ==================== 模块2：JVM ====================
  {
    module: "JVM调优",
    icon: "🧠",
    color: "#1CB0F6",
    lessons: [
      {
        id: "jvm-1",
        title: "内存区域",
        questions: [
          {
            type: "flashcard",
            q: "JVM 运行时内存区域有哪些？",
            a: "线程私有：程序计数器、虚拟机栈、本地方法栈。\n线程共享：堆、方法区(元空间)。\n堆是GC主战场。",
            tip: "栈私有，堆共享；计数器不会OOM"
          },
          {
            type: "flashcard",
            q: "堆内存分代模型？",
            a: "新生代(1/3)：Eden + 2个Survivor(8:1:1)。\n老年代(2/3)。\n新对象放Eden，Minor GC后存活进Survivor，年龄到15进老年代。",
            tip: "Eden:S0:S1 = 8:1:1，活够15次进老年代"
          },
          {
            type: "choice",
            q: "对象进入老年代的年龄阈值默认是？",
            options: ["10", "15", "20", "30"],
            answer: 1,
            tip: "-XX:MaxTenuringThreshold 默认15"
          }
        ]
      },
      {
        id: "jvm-2",
        title: "GC 算法",
        questions: [
          {
            type: "flashcard",
            q: "哪些是 GC Roots？",
            a: "1) 虚拟机栈中引用的对象(局部变量)\n2) 方法区静态变量、常量引用\n3) 本地方法栈JNI引用\n4) 同步锁持有的对象",
            tip: "栈、静态、常量、锁 → 根对象"
          },
          {
            type: "flashcard",
            q: "四种垃圾回收算法？",
            a: "1)标记-清除：产生碎片\n2)标记-复制：无碎片，浪费空间\n3)标记-整理：无碎片，效率低\n4)分代收集：新生代复制，老年代标记整理",
            tip: "清除有碎片，复制耗空间，整理最耗时"
          },
          {
            type: "flashcard",
            q: "CMS 和 G1 的区别？",
            a: "CMS：并发标记清除，老年代，低延迟但有碎片。\nG1：分Region，可预测停顿时间，整体标记整理+局部复制。\nJDK9+ G1 是默认。",
            tip: "CMS低延迟有碎片，G1可预测停顿"
          }
        ]
      },
      {
        id: "jvm-3",
        title: "引用与类加载",
        questions: [
          {
            type: "flashcard",
            q: "强/软/弱/虚引用区别？",
            a: "强：不回收(OutOfMemory也不)\n软：内存不足才回收(缓存)\n弱：下次GC必回收(WeakHashMap)\n虚：仅用于跟踪回收(堆外内存)",
            tip: "强不丢，软满丢，弱必丢，虚跟踪"
          },
          {
            type: "flashcard",
            q: "类加载过程？",
            a: "加载→验证→准备→解析→初始化→使用→卸载。\n准备阶段赋零值，初始化阶段执行<clinit>静态代码块。",
            tip: "加载验证准备解析初始化，准备赋零值"
          },
          {
            type: "choice",
            q: "双亲委派模型中，类加载器加载顺序是？",
            options: ["先自己再父", "先父再自己", "随机", "同级竞争"],
            answer: 1,
            tip: "向上委托父加载器，父加载不了才自己加载"
          }
        ]
      },
      {
        id: "jvm-4",
        title: "OOM 排查",
        questions: [
          {
            type: "flashcard",
            q: "OOM 怎么排查？",
            a: "1)加 -XX:+HeapDumpOnOutOfMemoryError 导出hprof\n2)用 MAT / JVisualVM 分析\n3)查大对象、内存泄漏点(静态集合、未关闭资源)\n4)结合jstat看GC频率",
            tip: "导出堆dump → MAT找大对象 → 定位泄漏"
          }
        ]
      }
    ]
  },

  // ==================== 模块3：并发编程 ====================
  {
    module: "并发编程",
    icon: "⚡",
    color: "#FF9600",
    lessons: [
      {
        id: "conc-1",
        title: "锁基础",
        questions: [
          {
            type: "flashcard",
            q: "synchronized 底层原理？",
            a: "基于对象监视器Monitor，monitorenter/monitorexit指令。\n锁升级：无锁→偏向锁→轻量级锁→重量级锁(不可降级)。",
            tip: "锁升级：偏→轻→重，一路升级不回头"
          },
          {
            type: "flashcard",
            q: "synchronized vs ReentrantLock？",
            a: "synchronized：JVM层，自动释放，不可中断。\nReentrantLock：API层，手动unlock(finally)，可中断/可超时/可公平/可绑定多条件。\n功能复杂用Lock。",
            tip: "简单用sync，复杂要Lock"
          },
          {
            type: "flashcard",
            q: "volatile 的作用？",
            a: "1)保证可见性(MESI缓存一致性协议，写回主存)\n2)禁止指令重排(内存屏障)\n3)不保证原子性(i++不行)。\n常用于状态标志位。",
            tip: "可见+有序，不保证原子"
          }
        ]
      },
      {
        id: "conc-2",
        title: "线程池",
        questions: [
          {
            type: "choice",
            q: "线程池核心参数有几个？",
            options: ["3个", "5个", "7个", "9个"],
            answer: 2,
            tip: "7个：corePoolSize, maxPoolSize, keepAliveTime, unit, workQueue, threadFactory, handler"
          },
          {
            type: "flashcard",
            q: "线程池工作流程？",
            a: "1)核心线程数未满→创建核心线程\n2)满了→进队列\n3)队列满了→创建非核心线程(到max)\n4)也满了→执行拒绝策略",
            tip: "核心→队列→非核心→拒绝"
          },
          {
            type: "flashcard",
            q: "四种拒绝策略？",
            a: "1)AbortPolicy：抛异常(默认)\n2)CallerRunsPolicy：调用者线程执行\n3)DiscardPolicy：直接丢弃\n4)DiscardOldestPolicy：丢队列最老的",
            tip: "抛/调者执行/丢/丢最老"
          }
        ]
      },
      {
        id: "conc-3",
        title: "并发工具",
        questions: [
          {
            type: "flashcard",
            q: "ConcurrentHashMap 1.8 原理？",
            a: "数组+链表+红黑树。\n用 CAS + synchronized(只锁当前桶头节点) 保证并发，锁粒度比1.7的Segment更细。",
            tip: "1.8 CAS+synchronized锁桶头，粒度更细"
          },
          {
            type: "flashcard",
            q: "死锁的四个必要条件？",
            a: "1)互斥 2)请求并持有 3)不可剥夺 4)循环等待。\n破坏任一即可避免，最常用破坏循环等待(按顺序加锁)。",
            tip: "互斥、持有、不剥夺、循环等待"
          },
          {
            type: "flashcard",
            q: "ThreadLocal 原理与内存泄漏？",
            a: "每个Thread有ThreadLocalMap，key是ThreadLocal弱引用，value是强引用。\n泄漏原因：key被GC后，value还在。\n解决：用完remove()。",
            tip: "弱引用key，强引用value，用完要remove"
          },
          {
            type: "choice",
            q: "CountDownLatch 和 CyclicBarrier 区别？",
            options: ["一样", "CountDownLatch一次性，CyclicBarrier可重用", "CyclicBarrier一次性", "都可重用"],
            answer: 1,
            tip: "CountDown减到0放行且一次性；CyclicBarrier凑齐即放行可重用"
          }
        ]
      }
    ]
  },

  // ==================== 模块4：Spring ====================
  {
    module: "Spring全家桶",
    icon: "🌱",
    color: "#8458FC",
    lessons: [
      {
        id: "spring-1",
        title: "IoC 基础",
        questions: [
          {
            type: "flashcard",
            q: "什么是 IoC？",
            a: "控制反转：对象创建和依赖关系交给Spring容器管理，而非new。\nDI(依赖注入)是IoC的实现方式：构造器/Setter/字段注入。",
            tip: "不new，让容器给你"
          },
          {
            type: "flashcard",
            q: "Bean 生命周期？",
            a: "实例化→属性赋值→初始化(aware/BeanPostProcessor前置/@PostConstruct/init-method/后置)→使用→销毁(@PreDestroy/destroy-method)。",
            tip: "实例化→填充→初始化→销毁"
          },
          {
            type: "choice",
            q: "Spring Bean 默认作用域是？",
            options: ["prototype", "singleton", "request", "session"],
            answer: 1,
            tip: "默认单例singleton，全容器一个实例"
          }
        ]
      },
      {
        id: "spring-2",
        title: "AOP 与事务",
        questions: [
          {
            type: "flashcard",
            q: "AOP 实现原理？",
            a: "动态代理：\n1)JDK动态代理：目标类有接口，基于反射\n2)CGLIB：目标类无接口，基于继承生成子类\nSpringBoot2.x默认CGLIB。",
            tip: "有接口JDK代理，无接口CGLIB继承"
          },
          {
            type: "flashcard",
            q: "Spring 事务传播行为有哪些？",
            a: "7种，核心3个：\nREQUIRED(默认)：有则加入，无则新建\nREQUIRES_NEW：总是新建事务，挂起当前\nNESTED：嵌套事务，savepoint回滚",
            tip: "REQUIRED加入/新建，REQUIRES_NEW总新建"
          },
          {
            type: "flashcard",
            q: "事务失效的场景？",
            a: "1)方法非public\n2)同类内部方法调用(this调用不走代理)\n3)异常被try-catch吞了\n4)默认只回滚RuntimeException\n5)数据库引擎不支持事务(MyISAM)",
            tip: "非public、自调用、吞异常、非运行时异常"
          }
        ]
      },
      {
        id: "spring-3",
        title: "SpringBoot 核心",
        questions: [
          {
            type: "flashcard",
            q: "SpringBoot 自动装配原理？",
            a: "@SpringBootApplication 内含 @EnableAutoConfiguration。\n通过 SPI 加载 META-INF/spring.factories 中的配置类，\n按@Conditional条件判断是否生效。",
            tip: "spring.factories + @Conditional"
          },
          {
            type: "flashcard",
            q: "@Component 和 @Bean 的区别？",
            a: "@Component：类注解，自动扫描，只能用在自己写的类上。\n@Bean：方法注解，显式声明，可装配第三方类。\n@Bean更灵活(可指定init/destroy)。",
            tip: "自己的类@Component，第三方类@Bean"
          },
          {
            type: "flashcard",
            q: "Spring 循环依赖怎么解决？",
            a: "三级缓存：\n1)singletonObjects：成品\n2)earlySingletonObjects：半成品\n3)singletonFactories：ObjectFactory工厂\nA创建中暴露工厂→B创建时拿A半成品→B完成→A完成。\n构造器注入无法解决。",
            tip: "三级缓存解决setter循环依赖"
          }
        ]
      },
      {
        id: "spring-4",
        title: "SpringCloud",
        questions: [
          {
            type: "flashcard",
            q: "微服务核心组件有哪些？",
            a: "注册中心(Nacos/Eureka)、配置中心(Nacos/Config)、\n网关(Gateway)、负载均衡(Ribbon)、\n熔断降级(Sentinel/Hystrix)、链路追踪(Sleuth+Zipkin)。",
            tip: "注册、配置、网关、负载、熔断、追踪"
          },
          {
            type: "flashcard",
            q: "Nacos vs Eureka？",
            a: "Eureka：AP，只做注册，最终一致，已停更。\nNacos：AP+CP切换，同时做注册中心和配置中心，\n支持DNS和RPC，阿里开源，活跃。",
            tip: "Nacos一个顶俩(Eureka+Config)"
          },
          {
            type: "choice",
            q: "Spring Cloud Gateway 默认基于什么？",
            options: ["Servlet", "WebFlux(Netty)", "Tomcat", "Undertow"],
            answer: 1,
            tip: "Gateway基于WebFlux+Netty，异步非阻塞"
          },
          {
            type: "flashcard",
            q: "Sentinel 熔断降级策略？",
            a: "1)慢调用比例\n2)异常比例\n3)异常数\n超过阈值触发熔断，过了时间窗口进入半开探测。",
            tip: "慢、异常比例、异常数"
          }
        ]
      }
    ]
  },

  // ==================== 模块5：MySQL ====================
  {
    module: "MySQL",
    icon: "🐬",
    color: "#FF4B4B",
    lessons: [
      {
        id: "mysql-1",
        title: "索引基础",
        questions: [
          {
            type: "flashcard",
            q: "索引为什么用 B+ 树不用 B 树？",
            a: "1)B+树非叶子节点不存数据，单节点能装更多key，树更矮\n2)叶子节点用链表相连，范围查询只需顺序遍历\n3)查询稳定，每次都走到叶子",
            tip: "B+树矮、快、范围查询爽"
          },
          {
            type: "flashcard",
            q: "聚簇索引 vs 非聚簇索引？",
            a: "聚簇索引：叶子节点存整行数据(InnoDB主键)。\n非聚簇索引(二级索引)：叶子存主键值。\n查非索引字段需回表。覆盖索引可避免回表。",
            tip: "聚簇存行，二级存主键，回表多一次"
          },
          {
            type: "choice",
            q: "最左前缀匹配：索引(a,b,c)，哪个查询能用索引？",
            options: ["WHERE b=1", "WHERE a=1 AND c=2", "WHERE a=1 AND b=2", "WHERE c=3"],
            answer: 2,
            tip: "从最左列开始匹配，中间不能断"
          }
        ]
      },
      {
        id: "mysql-2",
        title: "事务与隔离",
        questions: [
          {
            type: "flashcard",
            q: "事务的 ACID？",
            a: "Atomicity原子性(undo log)、Consistency一致性、\nIsolation隔离性(锁+MVCC)、Durability持久性(redo log)。",
            tip: "原子undo，持久redo，隔离MVCC"
          },
          {
            type: "flashcard",
            q: "四种事务隔离级别？",
            a: "1)读未提交→脏读\n2)读已提交(RC)→不可重复读\n3)可重复读(RR，MySQL默认)→幻读\n4)串行化→性能差\nInnoDB的RR用MVCC+间隙锁解决幻读。",
            tip: "脏读、不可重复读、幻读逐级解决"
          },
          {
            type: "flashcard",
            q: "MVCC 是什么？",
            a: "多版本并发控制。每行有隐藏字段：trx_id(事务id)、roll_pointer(回滚指针)。\n读操作读快照(历史版本)，写操作加锁。\n实现RC和RR的隔离级别。",
            tip: "快照读不加锁，读写不冲突"
          },
          {
            type: "flashcard",
            q: "redo log 和 undo log 区别？",
            a: "redo log：物理日志，记录数据页修改，保证持久性(crash-safe)，WAL预写。\nundo log：逻辑日志，记录反向操作，保证原子性(回滚)，支持MVCC。",
            tip: "redo重做保持久，undo回滚保原子"
          }
        ]
      },
      {
        id: "mysql-3",
        title: "优化与锁",
        questions: [
          {
            type: "flashcard",
            q: "慢查询怎么优化？",
            a: "1)开启slow_query_log\n2)EXPLAIN看执行计划(type、key、rows、Extra)\n3)加合适索引、避免全表扫\n4)避免索引失效(函数、!=、前导模糊)\n5)必要时分页优化",
            tip: "EXPLAIN + 建索引 + 防失效"
          },
          {
            type: "flashcard",
            q: "索引失效的场景？",
            a: "1)对索引列用函数/运算\n2)隐式类型转换\n3)LIKE以%开头\n4)OR连接非索引列\n5)违反最左前缀\n6)!= / <> / NOT IN 可能失效",
            tip: "函数、转换、前模糊、OR断链"
          },
          {
            type: "flashcard",
            q: "行锁、表锁、间隙锁？",
            a: "行锁：锁单行，并发高。\n表锁：锁整表，并发低。\n间隙锁：锁索引区间，防幻读，RR级别下。\n临键锁=行锁+间隙锁。",
            tip: "行锁细，表锁粗，间隙锁防幻读"
          }
        ]
      }
    ]
  },

  // ==================== 模块6：Redis ====================
  {
    module: "Redis",
    icon: "🔴",
    color: "#FF6B6B",
    lessons: [
      {
        id: "redis-1",
        title: "数据结构",
        questions: [
          {
            type: "flashcard",
            q: "Redis 五大数据结构及使用场景？",
            a: "String：缓存、计数器、分布式锁(setnx)。\nHash：对象字段。\nList：消息队列、最新列表。\nSet：去重、交集/并集。\nZSet：排行榜、延迟队列。",
            tip: "String计数，Hash对象，List队列，Set去重，ZSet排行"
          },
          {
            type: "flashcard",
            q: "Redis 为什么快？",
            a: "1)纯内存操作\n2)单线程(无锁竞争，避免上下文切换)\n3)IO多路复用(epoll)，一个线程处理多连接\n4)高效数据结构(跳表、压缩列表)",
            tip: "内存+单线程+IO多路复用"
          }
        ]
      },
      {
        id: "redis-2",
        title: "持久化",
        questions: [
          {
            type: "flashcard",
            q: "RDB 和 AOF 区别？",
            a: "RDB：快照，二进制，恢复快，可能丢数据。\nAOF：追加命令日志，数据安全，文件大恢复慢。\n生产一般混合持久化(RDB头+AOF尾)。",
            tip: "RDB快但丢数据，AOF全但慢"
          },
          {
            type: "choice",
            q: "Redis 过期键删除策略？",
            options: ["只定期删除", "只惰性删除", "定期+惰性", "立即删除"],
            answer: 2,
            tip: "定期扫描 + 访问时惰性删除"
          }
        ]
      },
      {
        id: "redis-3",
        title: "缓存问题",
        questions: [
          {
            type: "flashcard",
            q: "缓存穿透是什么？怎么解决？",
            a: "查不存在的数据，缓存和DB都没有，每次都打DB。\n解决：1)布隆过滤器 2)缓存空值(短过期)\n3)参数校验。",
            tip: "查不到的穿透 → 布隆/缓存空值"
          },
          {
            type: "flashcard",
            q: "缓存击穿是什么？怎么解决？",
            a: "热点key过期瞬间，大量请求打DB。\n解决：1)热点key永不过期 2)互斥锁(只让一个线程查DB)。",
            tip: "热点过期击穿 → 永不过期/互斥锁"
          },
          {
            type: "flashcard",
            q: "缓存雪崩是什么？怎么解决？",
            a: "大量key同时过期，或Redis宕机，请求全打DB。\n解决：1)过期时间加随机值\n2)Redis集群高可用\n3)限流降级。",
            tip: "集体过期雪崩 → 随机过期+集群+限流"
          }
        ]
      },
      {
        id: "redis-4",
        title: "分布式锁",
        questions: [
          {
            type: "flashcard",
            q: "Redis 分布式锁怎么实现？",
            a: "1)set key value NX EX 30 (原子加锁+过期)\n2)value用唯一标识(uuid)，解锁时判断是自己的锁再删\n3)解锁用Lua脚本保证原子性\n4)续期用看门狗(Redisson)。",
            tip: "setnx+过期，唯一value，Lua删，看门狗续期"
          },
          {
            type: "flashcard",
            q: "缓存和数据库一致性怎么保证？",
            a: "最佳实践：先更新数据库，再删除缓存(Cache Aside)。\n删除失败：重试+消息队列。\n极端并发：延迟双删(更新DB→删缓存→延时再删)。",
            tip: "更新DB→删缓存，失败靠MQ重试"
          }
        ]
      }
    ]
  },

  // ==================== 模块7：分布式 & 微服务 ====================
  {
    module: "分布式架构",
    icon: "🌐",
    color: "#5ED5A8",
    lessons: [
      {
        id: "dist-1",
        title: "CAP & BASE",
        questions: [
          {
            type: "flashcard",
            q: "CAP 定理？",
            a: "一致性(C)、可用性(A)、分区容错(P)三者只能同时满足两个。\n分布式系统P必须满足，所以在CP和AP间选。\nZookeeper是CP，Eureka是AP。",
            tip: "P必选，CP或AP二选一"
          },
          {
            type: "flashcard",
            q: "BASE 理论？",
            a: "Basically Available(基本可用)、Soft state(软状态)、\nEventually consistent(最终一致)。\n是对CAP中AP的延伸，牺牲强一致换可用性。",
            tip: "基本可用、软状态、最终一致"
          }
        ]
      },
      {
        id: "dist-2",
        title: "分布式事务",
        questions: [
          {
            type: "flashcard",
            q: "分布式事务解决方案？",
            a: "1)2PC/3PC：强一致，性能差，有阻塞\n2)TCC：Try-Confirm-Cancel，侵入性强\n3)本地消息表+MQ：最终一致，常用\n4)Seata：AT模式(自动补偿)，TCC、Saga",
            tip: "2PC强一致慢，TCC侵入强，MQ最终一致常用"
          }
        ]
      },
      {
        id: "dist-3",
        title: "消息队列",
        questions: [
          {
            type: "flashcard",
            q: "消息队列怎么保证不重复消费？",
            a: "消费端做幂等：1)唯一ID+去重表(redis setnx)\n2)数据库唯一索引\n3)乐观锁版本号。\n生产端可能重复投递，消费端必须幂等。",
            tip: "消费端幂等：唯一ID去重"
          },
          {
            type: "flashcard",
            q: "消息丢失怎么解决？",
            a: "1)生产端：confirm机制确认投递成功\n2)MQ端：持久化(消息+队列)\n3)消费端：手动ack，处理完再确认\n4)补偿：定时任务查未处理的。",
            tip: "confirm + 持久化 + 手动ack"
          },
          {
            type: "flashcard",
            q: "消息顺序性怎么保证？",
            a: "1)同一业务的消息发到同一个队列\n2)同一个队列只用一个消费者(单线程)\n3)如Kafka：同一key的消息到同一partition，partition单线程消费。",
            tip: "同key同队列，单线程消费"
          },
          {
            type: "choice",
            q: "Kafka、RabbitMQ、RocketMQ 中，吞吐量最高的是？",
            options: ["RabbitMQ", "Kafka", "RocketMQ", "一样"],
            answer: 1,
            tip: "Kafka吞吐量最高，适合日志大数据"
          }
        ]
      },
      {
        id: "dist-4",
        title: "服务治理",
        questions: [
          {
            type: "flashcard",
            q: "什么是服务雪崩？",
            a: "服务A调用B，B故障导致A线程堆积，进而拖垮A，\n连锁反应导致整个系统不可用。\n解决：熔断(Sentinel)、限流、降级、隔离(舱壁模式)。",
            tip: "一个挂，连坐全挂 → 熔断降级限流"
          }
        ]
      }
    ]
  },

  // ==================== 模块8：算法 & 设计模式 ====================
  {
    module: "算法&设计模式",
    icon: "🧩",
    color: "#CE82FF",
    lessons: [
      {
        id: "algo-1",
        title: "排序算法",
        questions: [
          {
            type: "flashcard",
            q: "常见排序算法时间复杂度？",
            a: "快排/归并/堆排：平均O(nlogn)。\n冒泡/选择/插入：O(n²)。\n计数/桶/基数：O(n+k)。\n快排最坏O(n²)，归并稳定O(nlogn)。",
            tip: "nlogn三兄弟：快、归、堆"
          },
          {
            type: "choice",
            q: "以下哪个排序是稳定的？",
            options: ["快排", "堆排", "归并排序", "选择排序"],
            answer: 2,
            tip: "归并、冒泡、插入、基数是稳定的"
          }
        ]
      },
      {
        id: "algo-2",
        title: "单例与工厂",
        questions: [
          {
            type: "flashcard",
            q: "单例模式的几种写法？",
            a: "1)饿汉式：类加载就创建，简单但浪费\n2)懒汉式：需用才创建，要加锁\n3)双重检查锁(DCL)：volatile+两次null判断\n4)静态内部类：推荐，懒加载+线程安全\n5)枚举：最安全，防反射破坏",
            tip: "饿汉简单，DCL经典，静态内部类最推荐"
          },
          {
            type: "flashcard",
            q: "工厂模式有哪几种？",
            a: "1)简单工厂：一个工厂按类型创建，违背开闭\n2)工厂方法：一个产品一个工厂，开闭好，类多\n3)抽象工厂：创建产品族(多个相关产品)。\nSpring的BeanFactory就是工厂模式。",
            tip: "简单工厂→工厂方法→抽象工厂"
          }
        ]
      },
      {
        id: "algo-3",
        title: "代理与Spring模式",
        questions: [
          {
            type: "flashcard",
            q: "代理模式和装饰器模式区别？",
            a: "代理：控制访问，代理和被代理是一对一，侧重「代理」关系。\n装饰器：增强功能，可多层嵌套，侧重「增强」。\nSpring AOP用动态代理。",
            tip: "代理控访问，装饰器加功能"
          },
          {
            type: "flashcard",
            q: "Spring 中用到了哪些设计模式？",
            a: "工厂(BeanFactory)、单例(默认scope)、\n代理(AOP)、模板方法(JdbcTemplate)、\n观察者(ApplicationListener)、策略(Resource接口)、\n适配器(HandlerAdapter)。",
            tip: "工厂、单例、代理、模板、观察者、策略、适配器"
          }
        ]
      }
    ]
  },

  // ==================== 模块9：网络 & 操作系统 ====================
  {
    module: "网络&OS",
    icon: "🌉",
    color: "#FFC800",
    lessons: [
      {
        id: "net-1",
        title: "TCP 连接",
        questions: [
          {
            type: "flashcard",
            q: "TCP 三次握手过程？",
            a: "1)客户端SYN→服务端\n2)服务端SYN+ACK→客户端\n3)客户端ACK→服务端\n为什么三次：确认双方收发能力都正常，防止过期连接。",
            tip: "SYN → SYN+ACK → ACK"
          },
          {
            type: "flashcard",
            q: "TCP 四次挥手？",
            a: "1)主动方FIN→被动方\n2)被动方ACK(进入CLOSE_WAIT)\n3)被动方FIN→主动方(进入LAST_ACK)\n4)主动方ACK(进入TIME_WAIT，等2MSL)\n四次因为被动方可能还有数据要发。",
            tip: "FIN→ACK→FIN→ACK，最后等2MSL"
          },
          {
            type: "flashcard",
            q: "TIME_WAIT 为什么等 2MSL？",
            a: "1)保证最后一个ACK能到达(丢了可重传)\n2)让本次连接的所有报文在网络中消失，避免影响新连接。",
            tip: "等ACK到 + 报文消失"
          }
        ]
      },
      {
        id: "net-2",
        title: "HTTP 协议",
        questions: [
          {
            type: "flashcard",
            q: "HTTP 和 HTTPS 区别？",
            a: "HTTP：明文，80端口，无加密。\nHTTPS：HTTP+SSL/TLS加密，443端口，需CA证书。\nHTTPS握手多了TLS协商(非对称加密换对称密钥)。",
            tip: "HTTPS = HTTP + TLS加密"
          },
          {
            type: "choice",
            q: "HTTP/2 相比 HTTP/1.1 的核心改进是？",
            options: ["改用UDP", "多路复用", "去掉请求头", "改用明文"],
            answer: 1,
            tip: "多路复用、头部压缩、服务端推送"
          }
        ]
      },
      {
        id: "net-3",
        title: "操作系统",
        questions: [
          {
            type: "flashcard",
            q: "进程和线程区别？",
            a: "进程：资源分配单位，有独立地址空间。\n线程：CPU调度单位，共享进程资源。\n线程切换开销小，进程切换开销大。",
            tip: "进程分资源，线程分CPU"
          },
          {
            type: "flashcard",
            q: "进程间通信(IPC)方式？",
            a: "管道(匿名/命名)、消息队列、共享内存、\n信号量、套接字(Socket)、信号。\n共享内存最快，Socket可跨机器。",
            tip: "管道、消息、共享内存、信号量、Socket"
          },
          {
            type: "flashcard",
            q: "死锁的四个必要条件？",
            a: "互斥、请求并持有、不可剥夺、循环等待。\n破坏循环等待(按顺序申请资源)最常用。",
            tip: "和并发死锁一样四条件"
          }
        ]
      }
    ]
  },

  // ==================== 模块10：工程化 ====================
  {
    module: "工程化&DevOps",
    icon: "🛠️",
    color: "#FF9F1C",
    lessons: [
      {
        id: "git-1",
        title: "Git 基础",
        questions: [
          {
            type: "flashcard",
            q: "Git 工作区、暂存区、版本库？",
            a: "工作区：你改文件的地方。\n暂存区：git add 后到这里(index)。\n版本库：git commit 后到本地仓库。\ngit push 才推到远程。",
            tip: "add进暂存，commit进库，push上远程"
          },
          {
            type: "flashcard",
            q: "git merge 和 git rebase 区别？",
            a: "merge：合并，产生合并提交，保留分支历史。\nrebase：变基，把当前分支提交「摘下来」接到目标分支后面，\n历史线性干净。\n已推到远程的分支别rebase(改历史)。",
            tip: "merge有合并点，rebase历史线性"
          },
          {
            type: "choice",
            q: "Git 中撤销工作区修改用什么命令？",
            options: ["git reset", "git checkout -- <file>", "git revert", "git rm"],
            answer: 1,
            tip: "git checkout -- file 撤销工作区修改"
          }
        ]
      },
      {
        id: "maven-1",
        title: "Maven",
        questions: [
          {
            type: "flashcard",
            q: "Maven 生命周期？",
            a: "三套生命周期：clean、default(构建)、site。\ndefault核心阶段：compile→test→package→install→deploy。\n执行一个阶段会自动执行前面所有阶段。",
            tip: "compile-test-package-install-deploy"
          },
          {
            type: "flashcard",
            q: "Maven 依赖冲突怎么解决？",
            a: "1)短路优先：路径近的优先\n2)声明优先：同路径下先声明的优先\n3)排除法：exclusion排除冲突依赖\n4)指定版本：dependencyManagement统一管理。",
            tip: "路径近优先，同路径先声明优先"
          }
        ]
      },
      {
        id: "docker-1",
        title: "Docker & K8s",
        questions: [
          {
            type: "flashcard",
            q: "Docker 镜像、容器、仓库？",
            a: "镜像：模板(只读)。\n容器：镜像的运行实例(可读写)。\n仓库：存镜像的地方(Docker Hub、私有仓库)。\n一个镜像可启动多个容器。",
            tip: "镜像是模板，容器是实例，仓库是仓库"
          },
          {
            type: "flashcard",
            q: "Docker 和虚拟机区别？",
            a: "虚拟机：有完整Guest OS，重量级，启动慢(分钟级)。\nDocker：共享宿主机内核，轻量级，启动快(秒级)，\n资源利用率高，隔离性略弱。",
            tip: "Docker轻量快，VM重量级慢"
          },
          {
            type: "flashcard",
            q: "K8s 核心组件？",
            a: "Master：kube-apiserver、etcd、scheduler、controller-manager。\nNode：kubelet、kube-proxy、容器运行时。\n最小调度单元是Pod。",
            tip: "Master管调度，Node干活，Pod最小单元"
          }
        ]
      }
    ]
  }
];

// 统计总题数
let TOTAL_QUESTIONS = 0;
QUESTION_BANK.forEach(m => m.lessons.forEach(l => TOTAL_QUESTIONS += l.questions.length));

// 获取所有题目（扁平列表，用于每日挑战等）
function getAllQuestions() {
  const all = [];
  QUESTION_BANK.forEach(m => {
    m.lessons.forEach(l => {
      l.questions.forEach(q => all.push({ ...q, module: m.module, moduleIcon: m.icon, lesson: l.title }));
    });
  });
  return all;
}
