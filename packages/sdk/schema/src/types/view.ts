//
// Copyright 2024 DXOS.org
//

import {
  create,
  JsonPath,
  type JsonProp,
  JsonSchemaType,
  QueryType,
  type ReactiveObject,
  S,
  TypedObject,
} from '@dxos/echo-schema';

import { createFieldId } from './projection';

/**
 * Stored field metadata (e.g., for UX).
 */
export const FieldSchema = S.Struct({
  id: S.NonEmptyString,
  path: JsonPath,
  visible: S.optional(S.Boolean),
  size: S.optional(S.Number),
  referencePath: S.optional(JsonPath),
}).pipe(S.mutable);

export type FieldType = S.Schema.Type<typeof FieldSchema>;

/**
 * Views are generated or user-defined projections of a schema's properties.
 * They are used to configure the visual representation of the data.
 * The query is separate from the view (queries configure the projection of data objects).
 */
export class ViewType extends TypedObject({
  typename: 'dxos.org/type/View',
  version: '0.1.0',
})({
  /**
   * Query used to retrieve data.
   * This includes the base type that the view schema (above) references.
   * It may include predicates that represent a persistent "drill-down" query.
   */
  query: QueryType,

  /**
   * Optional schema override used to customize the underlying schema.
   */
  schema: S.optional(JsonSchemaType),

  /**
   * UX metadata associated with displayed fields (in table, form, etc.)
   */
  fields: S.mutable(S.Array(FieldSchema)),

  // TODO(burdon): Readonly flag?
  // TODO(burdon): Add array of sort orders (which might be tuples).
}) {}

type CreateViewProps = {
  typename: string;
  jsonSchema?: JsonSchemaType;
  properties?: string[];
};

/**
 * Create view from existing schema.
 */
export const createView = ({
  typename,
  jsonSchema,
  properties: _properties,
}: CreateViewProps): ReactiveObject<ViewType> => {
  // TODO(burdon): Ensure not objects.
  const properties = _properties ?? Object.keys(jsonSchema?.properties ?? []).filter((p) => p !== 'id');
  return create(ViewType, {
    // schema: jsonSchema,
    query: {
      __typename: typename,
    },
    // Create initial fields.
    fields: properties.map((property) => ({
      id: createFieldId(),
      path: property as JsonProp,
    })),
  });
};