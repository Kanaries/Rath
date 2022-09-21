# Graphic Walker
Graphic Walker is a lite tableau style visual analysis interface. It is used for cases when users have specific analytic target or user want to analysis further result based on the recommended results by Rath's auto insights.

** You can also use Graphic Walker as a lite tableau style analysis app independently. It can be used as an independent app or an embedding module. **

Main features:

+ A grammar of graphics based visual analytic user interface where use can build visualization from low level visual channel encodings. 
+ A Data Explainer which explain some why some patterns occur / what may cause them.

## Usage

### use as an embedding module
```bash
yarn add @kanaries/graphic-walker

# or

npm i --save @kanaries/graphic-walker
```

In your app:
```typescript
import { GraphicWalker } from '@kanaries/graphic-walker';
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

### try local
```bash
# packages/graphic-walker
npm run dev
```


## I18n Support

GraphicWalker now support _English_ (as `"en"` or `"en-US"`) and _Chinese_ (as `"zh"` or `"zh-CN"`) with built-in locale resources. You can simply provide a valid string value (enumerated above) as `props.i18nLang` to set a language or synchronize your global i18n language with the component like the example given as follow.

```typescript
const YourApp = props => {
    // ...

    const curLang = /* get your i18n language */;

    return <GraphicWalker
        dataSource={dataSource}
        rawFields={fields}
        i18nLang={curLang}
    />
}
```

### Customize I18n

If you need i18n support to cover languages not supported currently, or to totally rewrite the content of any built-in resource(s), you can also provide your resource(s) as `props.i18nResources` to GraphicWalker like this.

```typescript
const yourResources = {
    'de-DE': {
        'key': 'value',
        ...
    },
    'fr-FR': {
        ...
    },
};

const YourApp = props => {
    // ...

    const curLang = /* get your i18n language */;

    return <GraphicWalker
        dataSource={dataSource}
        rawFields={fields}
        i18nLang={curLang}
        i18nResources={yourResources}
    />
}
```

GraphicWalker uses `react-i18next` to support i18n, which is based on `i18next`, so your translation resources should follow [this format](https://www.i18next.com/misc/json-format). You can simply fork and edit `/locales/en-US.json` to start your translation.
