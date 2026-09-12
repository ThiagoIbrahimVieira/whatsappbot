export declare const whatsappClient: {
    start: () => Promise<{
        communityMetadata: (jid: string) => Promise<import("@whiskeysockets/baileys").GroupMetadata>;
        communityCreate: (subject: string, body: string) => Promise<import("@whiskeysockets/baileys").GroupMetadata | null>;
        communityCreateGroup: (subject: string, participants: string[], parentCommunityJid: string) => Promise<import("@whiskeysockets/baileys").GroupMetadata | null>;
        communityLeave: (id: string) => Promise<void>;
        communityUpdateSubject: (jid: string, subject: string) => Promise<void>;
        communityLinkGroup: (groupJid: string, parentCommunityJid: string) => Promise<void>;
        communityUnlinkGroup: (groupJid: string, parentCommunityJid: string) => Promise<void>;
        communityFetchLinkedGroups: (jid: string) => Promise<{
            communityJid: string;
            isCommunity: boolean;
            linkedGroups: {
                id: string | undefined;
                subject: string;
                creation: number | undefined;
                owner: string | undefined;
                size: number | undefined;
            }[];
        }>;
        communityRequestParticipantsList: (jid: string) => Promise<{
            [key: string]: string;
        }[]>;
        communityRequestParticipantsUpdate: (jid: string, participants: string[], action: "approve" | "reject") => Promise<{
            status: string;
            jid: string | undefined;
        }[]>;
        communityParticipantsUpdate: (jid: string, participants: string[], action: import("@whiskeysockets/baileys").ParticipantAction) => Promise<{
            status: string;
            jid: string | undefined;
            content: import("@whiskeysockets/baileys").BinaryNode;
        }[]>;
        communityUpdateDescription: (jid: string, description?: string) => Promise<void>;
        communityInviteCode: (jid: string) => Promise<string | undefined>;
        communityRevokeInvite: (jid: string) => Promise<string | undefined>;
        communityAcceptInvite: (code: string) => Promise<string | undefined>;
        communityRevokeInviteV4: (communityJid: string, invitedJid: string) => Promise<boolean>;
        communityAcceptInviteV4: (key: string | import("@whiskeysockets/baileys").WAMessageKey, inviteMessage: import("@whiskeysockets/baileys").proto.Message.IGroupInviteMessage) => Promise<any>;
        communityGetInviteInfo: (code: string) => Promise<import("@whiskeysockets/baileys").GroupMetadata>;
        communityToggleEphemeral: (jid: string, ephemeralExpiration: number) => Promise<void>;
        communitySettingUpdate: (jid: string, setting: "announcement" | "not_announcement" | "locked" | "unlocked") => Promise<void>;
        communityMemberAddMode: (jid: string, mode: "admin_add" | "all_member_add") => Promise<void>;
        communityJoinApprovalMode: (jid: string, mode: "on" | "off") => Promise<void>;
        communityFetchAllParticipating: () => Promise<{
            [_: string]: import("@whiskeysockets/baileys").GroupMetadata;
        }>;
        logger: import("@whiskeysockets/baileys/lib/Utils/logger.js").ILogger;
        getOrderDetails: (orderId: string, tokenBase64: string) => Promise<import("@whiskeysockets/baileys").OrderDetails>;
        getCatalog: ({ jid, limit, cursor }: import("@whiskeysockets/baileys").GetCatalogOptions) => Promise<{
            products: import("@whiskeysockets/baileys").Product[];
            nextPageCursor: string | undefined;
        }>;
        getCollections: (jid?: string, limit?: number) => Promise<{
            collections: import("@whiskeysockets/baileys").CatalogCollection[];
        }>;
        productCreate: (create: import("@whiskeysockets/baileys").ProductCreate) => Promise<import("@whiskeysockets/baileys").Product>;
        productDelete: (productIds: string[]) => Promise<{
            deleted: number;
        }>;
        productUpdate: (productId: string, update: import("@whiskeysockets/baileys").ProductUpdate) => Promise<import("@whiskeysockets/baileys").Product>;
        updateBussinesProfile: (args: import("@whiskeysockets/baileys/lib/Types/Bussines.js").UpdateBussinesProfileProps) => Promise<any>;
        updateCoverPhoto: (photo: import("@whiskeysockets/baileys").WAMediaUpload) => Promise<number>;
        removeCoverPhoto: (id: string) => Promise<any>;
        sendMessageAck: (node: import("@whiskeysockets/baileys").BinaryNode, errorCode?: number) => Promise<void>;
        sendRetryRequest: (node: import("@whiskeysockets/baileys").BinaryNode, forceIncludeKeys?: boolean) => Promise<void>;
        rejectCall: (callId: string, callFrom: string) => Promise<void>;
        fetchMessageHistory: (count: number, oldestMsgKey: import("@whiskeysockets/baileys").WAMessageKey, oldestMsgTimestamp: number | import("long").default) => Promise<string>;
        requestPlaceholderResend: (messageKey: import("@whiskeysockets/baileys").WAMessageKey, msgData?: Partial<import("@whiskeysockets/baileys").WAMessage>) => Promise<string | undefined>;
        messageRetryManager: import("@whiskeysockets/baileys").MessageRetryManager | null;
        userDevicesCache: import("@whiskeysockets/baileys").PossiblyExtendedCacheStore | import("@cacheable/node-cache").NodeCache<import("@whiskeysockets/baileys").JidWithDevice[]>;
        devicesMutex: {
            mutex<T>(code: () => Promise<T> | T): Promise<T>;
        };
        issuePrivacyTokens: (jids: string[], timestamp?: number) => Promise<any>;
        assertSessions: (jids: string[], force?: boolean) => Promise<boolean>;
        relayMessage: (jid: string, message: import("@whiskeysockets/baileys").proto.IMessage, { messageId: msgId, participant, additionalAttributes, additionalNodes, useUserDevicesCache, useCachedGroupMetadata, statusJidList }: import("@whiskeysockets/baileys").MessageRelayOptions) => Promise<string>;
        sendReceipt: (jid: string, participant: string | undefined, messageIds: string[], type: import("@whiskeysockets/baileys").MessageReceiptType) => Promise<void>;
        sendReceipts: (keys: import("@whiskeysockets/baileys").WAMessageKey[], type: import("@whiskeysockets/baileys").MessageReceiptType) => Promise<void>;
        readMessages: (keys: import("@whiskeysockets/baileys").WAMessageKey[]) => Promise<void>;
        refreshMediaConn: (forceGet?: boolean) => Promise<import("@whiskeysockets/baileys").MediaConnInfo>;
        getMediaHost: () => string;
        waUploadToServer: import("@whiskeysockets/baileys").WAMediaUploadFunction;
        fetchPrivacySettings: (force?: boolean) => Promise<{
            [_: string]: string;
        }>;
        sendPeerDataOperationMessage: (pdoMessage: import("@whiskeysockets/baileys").proto.Message.IPeerDataOperationRequestMessage) => Promise<string>;
        createParticipantNodes: (recipientJids: string[], message: import("@whiskeysockets/baileys").proto.IMessage, extraAttrs?: import("@whiskeysockets/baileys").BinaryNode["attrs"], dsmMessage?: import("@whiskeysockets/baileys").proto.IMessage) => Promise<{
            nodes: import("@whiskeysockets/baileys").BinaryNode[];
            shouldIncludeDeviceIdentity: boolean;
        }>;
        getUSyncDevices: (jids: string[], useCache: boolean, ignoreZeroDevices: boolean) => Promise<(import("@whiskeysockets/baileys").JidWithDevice & {
            jid: string;
        })[]>;
        updateMemberLabel: (jid: string, memberLabel: string) => Promise<string>;
        updateMediaMessage: (message: import("@whiskeysockets/baileys").WAMessage) => Promise<import("@whiskeysockets/baileys").WAMessage>;
        sendMessage: (jid: string, content: import("@whiskeysockets/baileys").AnyMessageContent, options?: import("@whiskeysockets/baileys").MiscMessageGenerationOptions) => Promise<import("@whiskeysockets/baileys").WAMessage | undefined>;
        newsletterCreate: (name: string, description?: string) => Promise<import("@whiskeysockets/baileys").NewsletterMetadata>;
        newsletterUpdate: (jid: string, updates: import("@whiskeysockets/baileys").NewsletterUpdate) => Promise<unknown>;
        newsletterSubscribers: (jid: string) => Promise<{
            subscribers: number;
        }>;
        newsletterMetadata: (type: "invite" | "jid", key: string) => Promise<import("@whiskeysockets/baileys").NewsletterMetadata | null>;
        newsletterFollow: (jid: string) => Promise<unknown>;
        newsletterUnfollow: (jid: string) => Promise<unknown>;
        newsletterMute: (jid: string) => Promise<unknown>;
        newsletterUnmute: (jid: string) => Promise<unknown>;
        newsletterUpdateName: (jid: string, name: string) => Promise<unknown>;
        newsletterUpdateDescription: (jid: string, description: string) => Promise<unknown>;
        newsletterUpdatePicture: (jid: string, content: import("@whiskeysockets/baileys").WAMediaUpload) => Promise<unknown>;
        newsletterRemovePicture: (jid: string) => Promise<unknown>;
        newsletterReactMessage: (jid: string, serverId: string, reaction?: string) => Promise<void>;
        newsletterFetchMessages: (jid: string, count: number, since: number, after: number) => Promise<any>;
        subscribeNewsletterUpdates: (jid: string) => Promise<{
            duration: string;
        } | null>;
        newsletterAdminCount: (jid: string) => Promise<number>;
        newsletterChangeOwner: (jid: string, newOwnerJid: string) => Promise<void>;
        newsletterDemote: (jid: string, userJid: string) => Promise<void>;
        newsletterDelete: (jid: string) => Promise<void>;
        groupMetadata: (jid: string) => Promise<import("@whiskeysockets/baileys").GroupMetadata>;
        groupCreate: (subject: string, participants: string[]) => Promise<import("@whiskeysockets/baileys").GroupMetadata>;
        groupLeave: (id: string) => Promise<void>;
        groupUpdateSubject: (jid: string, subject: string) => Promise<void>;
        groupRequestParticipantsList: (jid: string) => Promise<{
            [key: string]: string;
        }[]>;
        groupRequestParticipantsUpdate: (jid: string, participants: string[], action: "approve" | "reject") => Promise<{
            status: string;
            jid: string | undefined;
        }[]>;
        groupParticipantsUpdate: (jid: string, participants: string[], action: import("@whiskeysockets/baileys").ParticipantAction) => Promise<{
            status: string;
            jid: string | undefined;
            content: import("@whiskeysockets/baileys").BinaryNode;
        }[]>;
        groupUpdateDescription: (jid: string, description?: string) => Promise<void>;
        groupInviteCode: (jid: string) => Promise<string | undefined>;
        groupRevokeInvite: (jid: string) => Promise<string | undefined>;
        groupAcceptInvite: (code: string) => Promise<string | undefined>;
        groupRevokeInviteV4: (groupJid: string, invitedJid: string) => Promise<boolean>;
        groupAcceptInviteV4: (key: string | import("@whiskeysockets/baileys").WAMessageKey, inviteMessage: import("@whiskeysockets/baileys").proto.Message.IGroupInviteMessage) => Promise<any>;
        groupGetInviteInfo: (code: string) => Promise<import("@whiskeysockets/baileys").GroupMetadata>;
        groupToggleEphemeral: (jid: string, ephemeralExpiration: number) => Promise<void>;
        groupSettingUpdate: (jid: string, setting: "announcement" | "not_announcement" | "locked" | "unlocked") => Promise<void>;
        groupMemberAddMode: (jid: string, mode: "admin_add" | "all_member_add") => Promise<void>;
        groupJoinApprovalMode: (jid: string, mode: "on" | "off") => Promise<void>;
        groupFetchAllParticipating: () => Promise<{
            [_: string]: import("@whiskeysockets/baileys").GroupMetadata;
        }>;
        serverProps: {
            privacyTokenOn1to1: boolean;
            profilePicPrivacyToken: boolean;
            lidTrustedTokenIssueToLid: boolean;
        };
        createCallLink: (type: "audio" | "video", event?: {
            startTime: number;
        }, timeoutMs?: number) => Promise<string | undefined>;
        getBotListV2: () => Promise<import("@whiskeysockets/baileys").BotListInfo[]>;
        messageMutex: {
            mutex<T>(code: () => Promise<T> | T): Promise<T>;
        };
        receiptMutex: {
            mutex<T>(code: () => Promise<T> | T): Promise<T>;
        };
        appStatePatchMutex: {
            mutex<T>(code: () => Promise<T> | T): Promise<T>;
        };
        notificationMutex: {
            mutex<T>(code: () => Promise<T> | T): Promise<T>;
        };
        upsertMessage: (msg: import("@whiskeysockets/baileys").WAMessage, type: import("@whiskeysockets/baileys").MessageUpsertType) => Promise<void>;
        appPatch: (patchCreate: import("@whiskeysockets/baileys").WAPatchCreate) => Promise<void>;
        sendPresenceUpdate: (type: import("@whiskeysockets/baileys").WAPresence, toJid?: string) => Promise<void>;
        presenceSubscribe: (toJid: string) => Promise<void>;
        profilePictureUrl: (jid: string, type?: "preview" | "image", timeoutMs?: number) => Promise<string | undefined>;
        fetchBlocklist: () => Promise<(string | undefined)[]>;
        fetchStatus: (...jids: string[]) => Promise<import("@whiskeysockets/baileys").USyncQueryResultList[] | undefined>;
        fetchDisappearingDuration: (...jids: string[]) => Promise<import("@whiskeysockets/baileys").USyncQueryResultList[] | undefined>;
        updateProfilePicture: (jid: string, content: import("@whiskeysockets/baileys").WAMediaUpload, dimensions?: {
            width: number;
            height: number;
        }) => Promise<void>;
        removeProfilePicture: (jid: string) => Promise<void>;
        updateProfileStatus: (status: string) => Promise<void>;
        updateProfileName: (name: string) => Promise<void>;
        updateBlockStatus: (jid: string, action: "block" | "unblock") => Promise<void>;
        updateDisableLinkPreviewsPrivacy: (isPreviewsDisabled: boolean) => Promise<void>;
        updateCallPrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyCallValue) => Promise<void>;
        updateMessagesPrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyMessagesValue) => Promise<void>;
        updateLastSeenPrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyValue) => Promise<void>;
        updateOnlinePrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyOnlineValue) => Promise<void>;
        updateProfilePicturePrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyValue) => Promise<void>;
        updateStatusPrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyValue) => Promise<void>;
        updateReadReceiptsPrivacy: (value: import("@whiskeysockets/baileys").WAReadReceiptsValue) => Promise<void>;
        updateGroupsAddPrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyGroupAddValue) => Promise<void>;
        updateDefaultDisappearingMode: (duration: number) => Promise<void>;
        getBusinessProfile: (jid: string) => Promise<import("@whiskeysockets/baileys").WABusinessProfile | void>;
        resyncAppState: (collections: readonly ("critical_unblock_low" | "regular_high" | "regular_low" | "critical_block" | "regular")[], isInitialSync: boolean) => Promise<void>;
        chatModify: (mod: import("@whiskeysockets/baileys").ChatModification, jid: string) => Promise<void>;
        cleanDirtyBits: (type: "account_sync" | "groups", fromTimestamp?: number | string) => Promise<void>;
        addOrEditContact: (jid: string, contact: import("@whiskeysockets/baileys").proto.SyncActionValue.IContactAction) => Promise<void>;
        removeContact: (jid: string) => Promise<void>;
        placeholderResendCache: import("@whiskeysockets/baileys").CacheStore;
        addLabel: (jid: string, labels: import("@whiskeysockets/baileys/lib/Types/Label.js").LabelActionBody) => Promise<void>;
        addChatLabel: (jid: string, labelId: string) => Promise<void>;
        removeChatLabel: (jid: string, labelId: string) => Promise<void>;
        addMessageLabel: (jid: string, messageId: string, labelId: string) => Promise<void>;
        removeMessageLabel: (jid: string, messageId: string, labelId: string) => Promise<void>;
        star: (jid: string, messages: {
            id: string;
            fromMe?: boolean;
        }[], star: boolean) => Promise<void>;
        addOrEditQuickReply: (quickReply: import("@whiskeysockets/baileys/lib/Types/Bussines.js").QuickReplyAction) => Promise<void>;
        removeQuickReply: (timestamp: string) => Promise<void>;
        type: "md";
        ws: import("@whiskeysockets/baileys/lib/Socket/Client/websocket.js").WebSocketClient;
        ev: import("@whiskeysockets/baileys").BaileysEventEmitter & {
            process(handler: (events: Partial<import("@whiskeysockets/baileys").BaileysEventMap>) => void | Promise<void>): () => void;
            buffer(): void;
            createBufferedFunction<A extends any[], T>(work: (...args: A) => Promise<T>): (...args: A) => Promise<T>;
            flush(): boolean;
            isBuffering(): boolean;
            destroy(): void;
        };
        authState: {
            creds: import("@whiskeysockets/baileys").AuthenticationCreds;
            keys: import("@whiskeysockets/baileys").SignalKeyStoreWithTransaction;
        };
        signalRepository: import("@whiskeysockets/baileys").SignalRepositoryWithLIDStore;
        user: import("@whiskeysockets/baileys").Contact | undefined;
        generateMessageTag: () => string;
        query: (node: import("@whiskeysockets/baileys").BinaryNode, timeoutMs?: number) => Promise<any>;
        waitForMessage: <T>(msgId: string, timeoutMs?: number | undefined) => Promise<T | undefined>;
        waitForSocketOpen: () => Promise<void>;
        sendRawMessage: (data: Uint8Array | Buffer) => Promise<void>;
        sendNode: (frame: import("@whiskeysockets/baileys").BinaryNode) => Promise<void>;
        logout: (msg?: string) => Promise<void>;
        end: (error: Error | undefined) => Promise<void>;
        registerSocketEndHandler: (handler: (error: Error | undefined) => void | Promise<void>) => void;
        onUnexpectedError: (err: Error | import("@hapi/boom").Boom, msg: string) => void;
        uploadPreKeys: (count?: number) => Promise<void>;
        uploadPreKeysToServerIfRequired: () => Promise<void>;
        digestKeyBundle: () => Promise<void>;
        rotateSignedPreKey: () => Promise<void>;
        requestPairingCode: (phoneNumber: string, customPairingCode?: string) => Promise<string>;
        updateServerTimeOffset: ({ attrs }: import("@whiskeysockets/baileys").BinaryNode) => void;
        sendUnifiedSession: () => Promise<void>;
        wamBuffer: import("@whiskeysockets/baileys").BinaryInfo;
        waitForConnectionUpdate: (check: (u: Partial<import("@whiskeysockets/baileys").ConnectionState>) => Promise<boolean | undefined>, timeoutMs?: number) => Promise<void>;
        sendWAMBuffer: (wamBuffer: Buffer) => Promise<any>;
        executeUSyncQuery: (usyncQuery: import("@whiskeysockets/baileys").USyncQuery) => Promise<import("@whiskeysockets/baileys").USyncQueryResult | undefined>;
        onWhatsApp: (...phoneNumber: string[]) => Promise<{
            jid: string;
            exists: boolean;
        }[] | undefined>;
        fetchAccountReachoutTimelock: () => Promise<import("@whiskeysockets/baileys").ReachoutTimelockState>;
        fetchNewChatMessageCap: () => Promise<import("@whiskeysockets/baileys").NewChatMessageCapInfo>;
    }>;
    stop: () => Promise<void>;
    isConnected: () => boolean;
    getSocket: () => {
        communityMetadata: (jid: string) => Promise<import("@whiskeysockets/baileys").GroupMetadata>;
        communityCreate: (subject: string, body: string) => Promise<import("@whiskeysockets/baileys").GroupMetadata | null>;
        communityCreateGroup: (subject: string, participants: string[], parentCommunityJid: string) => Promise<import("@whiskeysockets/baileys").GroupMetadata | null>;
        communityLeave: (id: string) => Promise<void>;
        communityUpdateSubject: (jid: string, subject: string) => Promise<void>;
        communityLinkGroup: (groupJid: string, parentCommunityJid: string) => Promise<void>;
        communityUnlinkGroup: (groupJid: string, parentCommunityJid: string) => Promise<void>;
        communityFetchLinkedGroups: (jid: string) => Promise<{
            communityJid: string;
            isCommunity: boolean;
            linkedGroups: {
                id: string | undefined;
                subject: string;
                creation: number | undefined;
                owner: string | undefined;
                size: number | undefined;
            }[];
        }>;
        communityRequestParticipantsList: (jid: string) => Promise<{
            [key: string]: string;
        }[]>;
        communityRequestParticipantsUpdate: (jid: string, participants: string[], action: "approve" | "reject") => Promise<{
            status: string;
            jid: string | undefined;
        }[]>;
        communityParticipantsUpdate: (jid: string, participants: string[], action: import("@whiskeysockets/baileys").ParticipantAction) => Promise<{
            status: string;
            jid: string | undefined;
            content: import("@whiskeysockets/baileys").BinaryNode;
        }[]>;
        communityUpdateDescription: (jid: string, description?: string) => Promise<void>;
        communityInviteCode: (jid: string) => Promise<string | undefined>;
        communityRevokeInvite: (jid: string) => Promise<string | undefined>;
        communityAcceptInvite: (code: string) => Promise<string | undefined>;
        communityRevokeInviteV4: (communityJid: string, invitedJid: string) => Promise<boolean>;
        communityAcceptInviteV4: (key: string | import("@whiskeysockets/baileys").WAMessageKey, inviteMessage: import("@whiskeysockets/baileys").proto.Message.IGroupInviteMessage) => Promise<any>;
        communityGetInviteInfo: (code: string) => Promise<import("@whiskeysockets/baileys").GroupMetadata>;
        communityToggleEphemeral: (jid: string, ephemeralExpiration: number) => Promise<void>;
        communitySettingUpdate: (jid: string, setting: "announcement" | "not_announcement" | "locked" | "unlocked") => Promise<void>;
        communityMemberAddMode: (jid: string, mode: "admin_add" | "all_member_add") => Promise<void>;
        communityJoinApprovalMode: (jid: string, mode: "on" | "off") => Promise<void>;
        communityFetchAllParticipating: () => Promise<{
            [_: string]: import("@whiskeysockets/baileys").GroupMetadata;
        }>;
        logger: import("@whiskeysockets/baileys/lib/Utils/logger.js").ILogger;
        getOrderDetails: (orderId: string, tokenBase64: string) => Promise<import("@whiskeysockets/baileys").OrderDetails>;
        getCatalog: ({ jid, limit, cursor }: import("@whiskeysockets/baileys").GetCatalogOptions) => Promise<{
            products: import("@whiskeysockets/baileys").Product[];
            nextPageCursor: string | undefined;
        }>;
        getCollections: (jid?: string, limit?: number) => Promise<{
            collections: import("@whiskeysockets/baileys").CatalogCollection[];
        }>;
        productCreate: (create: import("@whiskeysockets/baileys").ProductCreate) => Promise<import("@whiskeysockets/baileys").Product>;
        productDelete: (productIds: string[]) => Promise<{
            deleted: number;
        }>;
        productUpdate: (productId: string, update: import("@whiskeysockets/baileys").ProductUpdate) => Promise<import("@whiskeysockets/baileys").Product>;
        updateBussinesProfile: (args: import("@whiskeysockets/baileys/lib/Types/Bussines.js").UpdateBussinesProfileProps) => Promise<any>;
        updateCoverPhoto: (photo: import("@whiskeysockets/baileys").WAMediaUpload) => Promise<number>;
        removeCoverPhoto: (id: string) => Promise<any>;
        sendMessageAck: (node: import("@whiskeysockets/baileys").BinaryNode, errorCode?: number) => Promise<void>;
        sendRetryRequest: (node: import("@whiskeysockets/baileys").BinaryNode, forceIncludeKeys?: boolean) => Promise<void>;
        rejectCall: (callId: string, callFrom: string) => Promise<void>;
        fetchMessageHistory: (count: number, oldestMsgKey: import("@whiskeysockets/baileys").WAMessageKey, oldestMsgTimestamp: number | import("long").default) => Promise<string>;
        requestPlaceholderResend: (messageKey: import("@whiskeysockets/baileys").WAMessageKey, msgData?: Partial<import("@whiskeysockets/baileys").WAMessage>) => Promise<string | undefined>;
        messageRetryManager: import("@whiskeysockets/baileys").MessageRetryManager | null;
        userDevicesCache: import("@whiskeysockets/baileys").PossiblyExtendedCacheStore | import("@cacheable/node-cache").NodeCache<import("@whiskeysockets/baileys").JidWithDevice[]>;
        devicesMutex: {
            mutex<T>(code: () => Promise<T> | T): Promise<T>;
        };
        issuePrivacyTokens: (jids: string[], timestamp?: number) => Promise<any>;
        assertSessions: (jids: string[], force?: boolean) => Promise<boolean>;
        relayMessage: (jid: string, message: import("@whiskeysockets/baileys").proto.IMessage, { messageId: msgId, participant, additionalAttributes, additionalNodes, useUserDevicesCache, useCachedGroupMetadata, statusJidList }: import("@whiskeysockets/baileys").MessageRelayOptions) => Promise<string>;
        sendReceipt: (jid: string, participant: string | undefined, messageIds: string[], type: import("@whiskeysockets/baileys").MessageReceiptType) => Promise<void>;
        sendReceipts: (keys: import("@whiskeysockets/baileys").WAMessageKey[], type: import("@whiskeysockets/baileys").MessageReceiptType) => Promise<void>;
        readMessages: (keys: import("@whiskeysockets/baileys").WAMessageKey[]) => Promise<void>;
        refreshMediaConn: (forceGet?: boolean) => Promise<import("@whiskeysockets/baileys").MediaConnInfo>;
        getMediaHost: () => string;
        waUploadToServer: import("@whiskeysockets/baileys").WAMediaUploadFunction;
        fetchPrivacySettings: (force?: boolean) => Promise<{
            [_: string]: string;
        }>;
        sendPeerDataOperationMessage: (pdoMessage: import("@whiskeysockets/baileys").proto.Message.IPeerDataOperationRequestMessage) => Promise<string>;
        createParticipantNodes: (recipientJids: string[], message: import("@whiskeysockets/baileys").proto.IMessage, extraAttrs?: import("@whiskeysockets/baileys").BinaryNode["attrs"], dsmMessage?: import("@whiskeysockets/baileys").proto.IMessage) => Promise<{
            nodes: import("@whiskeysockets/baileys").BinaryNode[];
            shouldIncludeDeviceIdentity: boolean;
        }>;
        getUSyncDevices: (jids: string[], useCache: boolean, ignoreZeroDevices: boolean) => Promise<(import("@whiskeysockets/baileys").JidWithDevice & {
            jid: string;
        })[]>;
        updateMemberLabel: (jid: string, memberLabel: string) => Promise<string>;
        updateMediaMessage: (message: import("@whiskeysockets/baileys").WAMessage) => Promise<import("@whiskeysockets/baileys").WAMessage>;
        sendMessage: (jid: string, content: import("@whiskeysockets/baileys").AnyMessageContent, options?: import("@whiskeysockets/baileys").MiscMessageGenerationOptions) => Promise<import("@whiskeysockets/baileys").WAMessage | undefined>;
        newsletterCreate: (name: string, description?: string) => Promise<import("@whiskeysockets/baileys").NewsletterMetadata>;
        newsletterUpdate: (jid: string, updates: import("@whiskeysockets/baileys").NewsletterUpdate) => Promise<unknown>;
        newsletterSubscribers: (jid: string) => Promise<{
            subscribers: number;
        }>;
        newsletterMetadata: (type: "invite" | "jid", key: string) => Promise<import("@whiskeysockets/baileys").NewsletterMetadata | null>;
        newsletterFollow: (jid: string) => Promise<unknown>;
        newsletterUnfollow: (jid: string) => Promise<unknown>;
        newsletterMute: (jid: string) => Promise<unknown>;
        newsletterUnmute: (jid: string) => Promise<unknown>;
        newsletterUpdateName: (jid: string, name: string) => Promise<unknown>;
        newsletterUpdateDescription: (jid: string, description: string) => Promise<unknown>;
        newsletterUpdatePicture: (jid: string, content: import("@whiskeysockets/baileys").WAMediaUpload) => Promise<unknown>;
        newsletterRemovePicture: (jid: string) => Promise<unknown>;
        newsletterReactMessage: (jid: string, serverId: string, reaction?: string) => Promise<void>;
        newsletterFetchMessages: (jid: string, count: number, since: number, after: number) => Promise<any>;
        subscribeNewsletterUpdates: (jid: string) => Promise<{
            duration: string;
        } | null>;
        newsletterAdminCount: (jid: string) => Promise<number>;
        newsletterChangeOwner: (jid: string, newOwnerJid: string) => Promise<void>;
        newsletterDemote: (jid: string, userJid: string) => Promise<void>;
        newsletterDelete: (jid: string) => Promise<void>;
        groupMetadata: (jid: string) => Promise<import("@whiskeysockets/baileys").GroupMetadata>;
        groupCreate: (subject: string, participants: string[]) => Promise<import("@whiskeysockets/baileys").GroupMetadata>;
        groupLeave: (id: string) => Promise<void>;
        groupUpdateSubject: (jid: string, subject: string) => Promise<void>;
        groupRequestParticipantsList: (jid: string) => Promise<{
            [key: string]: string;
        }[]>;
        groupRequestParticipantsUpdate: (jid: string, participants: string[], action: "approve" | "reject") => Promise<{
            status: string;
            jid: string | undefined;
        }[]>;
        groupParticipantsUpdate: (jid: string, participants: string[], action: import("@whiskeysockets/baileys").ParticipantAction) => Promise<{
            status: string;
            jid: string | undefined;
            content: import("@whiskeysockets/baileys").BinaryNode;
        }[]>;
        groupUpdateDescription: (jid: string, description?: string) => Promise<void>;
        groupInviteCode: (jid: string) => Promise<string | undefined>;
        groupRevokeInvite: (jid: string) => Promise<string | undefined>;
        groupAcceptInvite: (code: string) => Promise<string | undefined>;
        groupRevokeInviteV4: (groupJid: string, invitedJid: string) => Promise<boolean>;
        groupAcceptInviteV4: (key: string | import("@whiskeysockets/baileys").WAMessageKey, inviteMessage: import("@whiskeysockets/baileys").proto.Message.IGroupInviteMessage) => Promise<any>;
        groupGetInviteInfo: (code: string) => Promise<import("@whiskeysockets/baileys").GroupMetadata>;
        groupToggleEphemeral: (jid: string, ephemeralExpiration: number) => Promise<void>;
        groupSettingUpdate: (jid: string, setting: "announcement" | "not_announcement" | "locked" | "unlocked") => Promise<void>;
        groupMemberAddMode: (jid: string, mode: "admin_add" | "all_member_add") => Promise<void>;
        groupJoinApprovalMode: (jid: string, mode: "on" | "off") => Promise<void>;
        groupFetchAllParticipating: () => Promise<{
            [_: string]: import("@whiskeysockets/baileys").GroupMetadata;
        }>;
        serverProps: {
            privacyTokenOn1to1: boolean;
            profilePicPrivacyToken: boolean;
            lidTrustedTokenIssueToLid: boolean;
        };
        createCallLink: (type: "audio" | "video", event?: {
            startTime: number;
        }, timeoutMs?: number) => Promise<string | undefined>;
        getBotListV2: () => Promise<import("@whiskeysockets/baileys").BotListInfo[]>;
        messageMutex: {
            mutex<T>(code: () => Promise<T> | T): Promise<T>;
        };
        receiptMutex: {
            mutex<T>(code: () => Promise<T> | T): Promise<T>;
        };
        appStatePatchMutex: {
            mutex<T>(code: () => Promise<T> | T): Promise<T>;
        };
        notificationMutex: {
            mutex<T>(code: () => Promise<T> | T): Promise<T>;
        };
        upsertMessage: (msg: import("@whiskeysockets/baileys").WAMessage, type: import("@whiskeysockets/baileys").MessageUpsertType) => Promise<void>;
        appPatch: (patchCreate: import("@whiskeysockets/baileys").WAPatchCreate) => Promise<void>;
        sendPresenceUpdate: (type: import("@whiskeysockets/baileys").WAPresence, toJid?: string) => Promise<void>;
        presenceSubscribe: (toJid: string) => Promise<void>;
        profilePictureUrl: (jid: string, type?: "preview" | "image", timeoutMs?: number) => Promise<string | undefined>;
        fetchBlocklist: () => Promise<(string | undefined)[]>;
        fetchStatus: (...jids: string[]) => Promise<import("@whiskeysockets/baileys").USyncQueryResultList[] | undefined>;
        fetchDisappearingDuration: (...jids: string[]) => Promise<import("@whiskeysockets/baileys").USyncQueryResultList[] | undefined>;
        updateProfilePicture: (jid: string, content: import("@whiskeysockets/baileys").WAMediaUpload, dimensions?: {
            width: number;
            height: number;
        }) => Promise<void>;
        removeProfilePicture: (jid: string) => Promise<void>;
        updateProfileStatus: (status: string) => Promise<void>;
        updateProfileName: (name: string) => Promise<void>;
        updateBlockStatus: (jid: string, action: "block" | "unblock") => Promise<void>;
        updateDisableLinkPreviewsPrivacy: (isPreviewsDisabled: boolean) => Promise<void>;
        updateCallPrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyCallValue) => Promise<void>;
        updateMessagesPrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyMessagesValue) => Promise<void>;
        updateLastSeenPrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyValue) => Promise<void>;
        updateOnlinePrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyOnlineValue) => Promise<void>;
        updateProfilePicturePrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyValue) => Promise<void>;
        updateStatusPrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyValue) => Promise<void>;
        updateReadReceiptsPrivacy: (value: import("@whiskeysockets/baileys").WAReadReceiptsValue) => Promise<void>;
        updateGroupsAddPrivacy: (value: import("@whiskeysockets/baileys").WAPrivacyGroupAddValue) => Promise<void>;
        updateDefaultDisappearingMode: (duration: number) => Promise<void>;
        getBusinessProfile: (jid: string) => Promise<import("@whiskeysockets/baileys").WABusinessProfile | void>;
        resyncAppState: (collections: readonly ("critical_unblock_low" | "regular_high" | "regular_low" | "critical_block" | "regular")[], isInitialSync: boolean) => Promise<void>;
        chatModify: (mod: import("@whiskeysockets/baileys").ChatModification, jid: string) => Promise<void>;
        cleanDirtyBits: (type: "account_sync" | "groups", fromTimestamp?: number | string) => Promise<void>;
        addOrEditContact: (jid: string, contact: import("@whiskeysockets/baileys").proto.SyncActionValue.IContactAction) => Promise<void>;
        removeContact: (jid: string) => Promise<void>;
        placeholderResendCache: import("@whiskeysockets/baileys").CacheStore;
        addLabel: (jid: string, labels: import("@whiskeysockets/baileys/lib/Types/Label.js").LabelActionBody) => Promise<void>;
        addChatLabel: (jid: string, labelId: string) => Promise<void>;
        removeChatLabel: (jid: string, labelId: string) => Promise<void>;
        addMessageLabel: (jid: string, messageId: string, labelId: string) => Promise<void>;
        removeMessageLabel: (jid: string, messageId: string, labelId: string) => Promise<void>;
        star: (jid: string, messages: {
            id: string;
            fromMe?: boolean;
        }[], star: boolean) => Promise<void>;
        addOrEditQuickReply: (quickReply: import("@whiskeysockets/baileys/lib/Types/Bussines.js").QuickReplyAction) => Promise<void>;
        removeQuickReply: (timestamp: string) => Promise<void>;
        type: "md";
        ws: import("@whiskeysockets/baileys/lib/Socket/Client/websocket.js").WebSocketClient;
        ev: import("@whiskeysockets/baileys").BaileysEventEmitter & {
            process(handler: (events: Partial<import("@whiskeysockets/baileys").BaileysEventMap>) => void | Promise<void>): () => void;
            buffer(): void;
            createBufferedFunction<A extends any[], T>(work: (...args: A) => Promise<T>): (...args: A) => Promise<T>;
            flush(): boolean;
            isBuffering(): boolean;
            destroy(): void;
        };
        authState: {
            creds: import("@whiskeysockets/baileys").AuthenticationCreds;
            keys: import("@whiskeysockets/baileys").SignalKeyStoreWithTransaction;
        };
        signalRepository: import("@whiskeysockets/baileys").SignalRepositoryWithLIDStore;
        user: import("@whiskeysockets/baileys").Contact | undefined;
        generateMessageTag: () => string;
        query: (node: import("@whiskeysockets/baileys").BinaryNode, timeoutMs?: number) => Promise<any>;
        waitForMessage: <T>(msgId: string, timeoutMs?: number | undefined) => Promise<T | undefined>;
        waitForSocketOpen: () => Promise<void>;
        sendRawMessage: (data: Uint8Array | Buffer) => Promise<void>;
        sendNode: (frame: import("@whiskeysockets/baileys").BinaryNode) => Promise<void>;
        logout: (msg?: string) => Promise<void>;
        end: (error: Error | undefined) => Promise<void>;
        registerSocketEndHandler: (handler: (error: Error | undefined) => void | Promise<void>) => void;
        onUnexpectedError: (err: Error | import("@hapi/boom").Boom, msg: string) => void;
        uploadPreKeys: (count?: number) => Promise<void>;
        uploadPreKeysToServerIfRequired: () => Promise<void>;
        digestKeyBundle: () => Promise<void>;
        rotateSignedPreKey: () => Promise<void>;
        requestPairingCode: (phoneNumber: string, customPairingCode?: string) => Promise<string>;
        updateServerTimeOffset: ({ attrs }: import("@whiskeysockets/baileys").BinaryNode) => void;
        sendUnifiedSession: () => Promise<void>;
        wamBuffer: import("@whiskeysockets/baileys").BinaryInfo;
        waitForConnectionUpdate: (check: (u: Partial<import("@whiskeysockets/baileys").ConnectionState>) => Promise<boolean | undefined>, timeoutMs?: number) => Promise<void>;
        sendWAMBuffer: (wamBuffer: Buffer) => Promise<any>;
        executeUSyncQuery: (usyncQuery: import("@whiskeysockets/baileys").USyncQuery) => Promise<import("@whiskeysockets/baileys").USyncQueryResult | undefined>;
        onWhatsApp: (...phoneNumber: string[]) => Promise<{
            jid: string;
            exists: boolean;
        }[] | undefined>;
        fetchAccountReachoutTimelock: () => Promise<import("@whiskeysockets/baileys").ReachoutTimelockState>;
        fetchNewChatMessageCap: () => Promise<import("@whiskeysockets/baileys").NewChatMessageCapInfo>;
    } | null;
    getAuthInfo: () => {
        isConnected: boolean;
        pairingCode: string | null;
        qr: string | null;
    };
    resetAuth: () => Promise<void>;
};
