//
// Copyright 2021 DXOS.org
//

/**
 * Hypercore Typescript Definitions version 9.12.0
 * NOTE: Must not clash with 'hypercore' package name.
 *
 * https://hypercore-protocol.org
 * https://www.npmjs.com/package/hypercore/v/9.12.0
 * https://github.com/hypercore-protocol/hypercore/tree/v9.12.0
 * https://github.com/hypercore-protocol/hypercore/blob/v9.12.0/index.js#L53
 */
declare module 'hypercore' {
  import type { ProtocolStream } from 'hypercore-protocol';
  import type { Nanoresource, NanoresourceProperties } from 'nanoresource';
  import type { RandomAccessStorageConstructor } from 'random-access-storage';
  import { Readable, Writable } from 'streamx';

  export type Callback<T> = (err: Error | null, result: T) => void;

  /**
   * Download range.
   */
  export type Range = {
    start: number;
    end?: number;
    linear?: boolean;
  };

  /**
   * https://github.com/mafintosh/abstract-encoding
   */
  export type AbstractValueEncoding<T = any> = {
    encode: (obj: T) => Buffer;
    decode: (buffer: Buffer) => T;
  };

  export type ValueEncoding<T = any> = 'json' | 'utf-8' | 'binary' | AbstractValueEncoding<T>;

  /**
   * Crypto
   */
  export interface Crypto {
    sign: (data: any, secretKey: Buffer, cb: Callback<any>) => void;
    verify: (signature: any, data: any, key: Buffer, cb: Callback<boolean>) => void;
  }

  /**
   * https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#var-stream--feedcreatereadstreamoptions
   */
  export type ReadStreamOptions = {
    start?: number;
    end?: number;
    snapshot?: boolean;
    tail?: boolean;
    live?: boolean;
    timeout?: number;
    wait?: boolean;
    batch?: number;
  };

  /**
   * https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#const-id--feedgetindex-options-callback
   */
  // TODO(burdon): Change all value defs to default.
  export type GetOptions = {
    wait?: true;
    onwait?: () => {};
    timeout?: 0;
    valueEncoding?: ValueEncoding;
  };

  /**
   * https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#var-stream--feedcreatewritestreamopts
   */
  export type WriteStreamOptions = {
    maxBlockSize?: number;
  };

  /**
   * https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#var-stream--feedreplicateisinitiator-options
   */
  export type ReplicationOptions = {
    initiator?: ProtocolStream | boolean;
    stream?: ProtocolStream;
    live?: boolean;
    ack?: boolean;
    download?: boolean;
    upload?: boolean;
    encrypted?: boolean;
    noise?: boolean;
    keyPair?: { publicKey: Buffer; secretKey: Buffer };
    onauthenticate?: (remotePublicKey: Buffer, cb: () => void) => void;
    onfeedauthenticate?: (feed: Hypercore, remotePublicKey: Buffer, cb: () => void) => void;
    maxRequests?: number; // Default 16.
  };

  /**
   * https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedstats
   */
  export type Stats = {
    peers: Stats[];
    totals: {
      uploadedBytes: number;
      uploadedBlocks: number;
      downloadedBytes: number;
      downloadedBlocks: number;
    };
  };

  /**
   * Bi-directional custom message path for non-feed data exchange.
   * https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#ext--feedregisterextensionname-handlers
   */
  export interface StreamExtension {
    // Send message to extension handler on other side.
    send: (message: Buffer, peer: Buffer) => void;

    // Send message to every peer.
    broadcast: (message: Buffer) => void;

    // Destroy and unregister from stream.
    destroy: () => void;
  }

  interface StreamExtensionHandlers<T> {
    encoding?: ValueEncoding<T>;
    onmessage?: (message: Buffer, peer: Buffer) => any;
    onerror?: (error: any) => any;
  }

  /**
   * https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#var-feed--hypercorestorage-key-options
   */
  export type HypercoreOptions = {
    sparse?: boolean; // Do not mark the entire feed to be downloaded.
    eagerUpdate?: boolean;
    maxRequests?: number;
    createIfMissing?: boolean;
    secretKey?: Buffer;
    valueEncoding?: ValueEncoding;
    crypto?: Crypto;
    writable?: boolean;
    stats?: boolean;
  };

  export type Proof = {
    nodes: {
      index: number;
      hash: Buffer;
      size: number;
    }[];
    signature: Buffer;
  };

  /**
   * Shared property definitions for raw and wrapped objects.
   */
  export interface HypercoreProperties extends NanoresourceProperties {
    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedwritable
    readonly writable: boolean;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedreadable
    readonly readable: boolean;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedkey
    readonly key: Buffer;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedkey
    readonly secretKey: Buffer;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#discoveryKey
    readonly discoveryKey: Buffer;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedlength
    readonly length: number;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedbytelength
    readonly byteLength: number;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedpeers
    readonly peers: {
      publicKey: Buffer;
    };

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedstats
    readonly stats: Stats;

    bitfield?: HypercoreBitfield;

    readonly sparse: boolean;
  }

  export interface HypercoreBitfield {
    data: any; // sparse-bitfield package

    total(start: number, end: number): number;

    // TODO(dmaretskyi): More props.
  }

  /**
   * Raw hypercore feed.
   * https://github.com/hypercore-protocol/hypercore/blob/v9.12.0/index.js#L53
   *
   * Events: [`ready`, `error`, `download`, `upload`, `append`, `sync`, `close`]
   * https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedonready
   */
  export interface Hypercore<T = any> extends Nanoresource, HypercoreProperties {
    // Alias for open.
    ready(cb: Callback<void>): void;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedappenddata-callback
    append(data: T | T[], cb: Callback<number>): void;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#var-stream--feedcreatereadstreamoptions
    createReadStream(options?: ReadStreamOptions): Readable;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#var-stream--feedcreatewritestreamopts
    createWriteStream(options?: WriteStreamOptions): Writable;

    /**
     * Sets up a replication stream.
     * Blocks are downloaded:
     * - explicitly when download or get called;
     * - implicitly if options.sparse and options.eagerUpdate are true.
     * @param initiator
     * @param options
     */
    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#var-stream--feedreplicateisinitiator-options
    replicate(initiator: boolean, options?: ReplicationOptions): ProtocolStream;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feeddestroystoragecallback
    destroyStorage(cb: Callback<{ valid: number; invalid: number }>): void;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedauditcallback
    audit(cb: Callback<{ valid: number; invalid: number }>): void;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#var-bool--feedhasindex
    has(index: number): void;
    has(start: number, end?: number): boolean;

    // https://github.com/holepunchto/hypercore/tree/v9.12.0#feedclearstart-end-callback
    clear(start: number, end?: number, cb?: Callback<void>): void;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedheadoptions-callback
    /** @deprecated remove in v10 */
    head(options: any, cb: Callback<T>): void;
    head(cb: Callback<T>): void;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#const-id--feedgetindex-options-callback
    get(index: number, options: GetOptions, cb: Callback<T>): void;
    get(index: number, cb: Callback<T>): void;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedgetbatchstart-end-options-callback
    /** @deprecated remove in v10 */
    getBatch(start: number, end: number, options?: GetOptions, cb?: Callback<T[]>): void;

    // TODO(burdon): Documented signature is different from code.
    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#const-id--feeddownloadrange-callback
    download(range?: Range, cb?: Callback<number>): number;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#var-number--feeddownloadedstart-end
    downloaded(start?: number, end?: number): boolean;

    // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#feedundownloaddownloadid
    undownload(id: number): void;

    // Define custom messages paths (unrelated to hypercore exchange), which are multiplexed on the stream.
    // https://github.com/hypercore-protocol/hypercore-protocol#stream-message-extensions
    registerExtension(name: string, handlers?: StreamExtensionHandlers<T>): StreamExtension;

    // https://github.com/holepunchto/hypercore/tree/v9.12.0#feedsetdownloadingbool
    setDownloading(bool): void;

    proof(index: number, cb?: Callback<Proof>): void;

    put(index: number, data: T, proof: Proof, cb?: Callback<void>): void;

    // TODO(dmaretskyi): Add other events.
    on(event: string, cb: (...args: any) => void): void;
    on(event: 'download', cb: (index: number, data: any) => void): void;
  }

  export type HypercoreConstructor = (
    storage: string | RandomAccessStorageConstructor,
    key?: Buffer | string,
    options?: HypercoreOptions,
  ) => Hypercore;

  // Default constructor.
  // https://github.com/hypercore-protocol/hypercore/tree/v9.12.0#var-feed--hypercorestorage-key-options
  export function hypercore<T = any>(
    storage: string | RandomAccessStorageConstructor,
    key?: Buffer | string,
    options?: HypercoreOptions,
  ): Hypercore<T>;

  export default hypercore;
}
