export enum InboxSourceTypeEnum {
    MANUAL = "MANUAL",
    EMAIL = "EMAIL",
    SLACK = "SLACK"
}

export type InboxSourceTypeEnumType = keyof typeof InboxSourceTypeEnum;

export enum InboxStatusEnum {
    DRAFT = "DRAFT",
    PROMOTED = "PROMOTED"
}

export type InboxStatusEnumType = keyof typeof InboxStatusEnum;
