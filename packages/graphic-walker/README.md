# Graphic Walker
Graphic Walker is a lite tableau style visual analysis interface. It is used for cases when users have specific analytic target or user want to analysis further result based on the recommanded results by Rath's auto insights.

** You can also use Graphic Walker as a lite tableau style analysis app independently. It can be used as an independent app or an embeding module. **

Main features:

+ A grammar of graphics based visual analytic user interface where use can build visualization from low level visual channel encodings. 
+ A Data Explainer which explain some why some patterns occur / what may cause them.

## Usage
```bash
cd graphic-waler
yarn install
npm run build
```

In your app:
```typescript
import { GraphicWalker } from 'graphic-walker';
import 'graphic-walker/dist/style.css'

const YourEmbeddingTableauStyleApp: React.FC = props => {
    const { dataSource, fields } = props;

    return <GraphicWalker
        dataSource={dataSource}
        rawFields={fields}
    />
}

export default YourEmbeddingTableauStyleApp;
```