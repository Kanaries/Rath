# Show Me

A implementation of tableau showme feature. Not completely follow the tableau's rules.

```typescript
interface iView {
  dimensions: Array<Field>;
  measures: Array<Field>;
  dataSource: Array<Row>;
}

interface oView {
	facets?: Array<Field>;
  rows: Array<Field>;
  columns: Array<Field>;
  x: Field | null;
  y: Field | null;
  geom: GeomType;
  color: Field | null;
  opacity: Field | null;
  size: Field | null;
  shape: Field | null;
  coordinate?: string;
}

type showme(dataView) = Array<[oView, number]>
```