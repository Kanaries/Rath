export type PreferenceNumDescriptor = {
    type: 'number';
    minimum?: number;
    exclusiveMinimum?: number;
    maximum?: number;
    exclusiveMaximum?: number;
    value: number;
    onChange: (value: number) => void;
};

export type PreferenceBoolDescriptor = {
    type: 'boolean';
    value: boolean;
    onChange: (value: boolean) => void;
};

export type PreferenceEnumDescriptor<E extends string | number> = {
    type: 'enum';
    options: E[];
    value: E;
    onChange: (value: E) => void;
};

type WithDefaultValue<D extends { value: any }> = D & (
    | { required: true }
    | { required?: false; defaultValue: D['value'] }
);

export type AnyDescriptor = WithDefaultValue<(
    | PreferenceNumDescriptor
    | PreferenceBoolDescriptor
    | PreferenceEnumDescriptor<string | number>
)> & {
    title: string;
    description: string;
};

export type PreferencesSchema<P extends {
    [propertyName: string]: AnyDescriptor | PreferencesSchema;
} = {
    [propertyName: string]: AnyDescriptor | PreferencesSchema;
}> = {
    type: 'object';
    description: string;
    properties: P;
    allOf?: {
        if: any;
        then: any;
        else?: any;
    }[];
    anyOf?: {
        properties: { [key: string]: { const: string | number } };
        required?: string[];
    }[];
};
