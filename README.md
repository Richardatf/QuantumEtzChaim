# Quantum Etz Chaim

The visual Tree companion to [IvritCode](https://ivritcode.org/).

## IvritCode exchange

IvritCode can open this site with a versioned, validated execution snapshot in
the `exchange` query parameter. The Tree deterministically highlights nodes from
the source and returning letters, presents the resulting register metadata, and
provides an **Edit in IvritCode** link that restores the original Hebrew source.

The canonical contract is `ivritcode-exchange-0.1`, defined in the IvritCode
repository at `spec/ivritcode-exchange-0.1.schema.json`. Unknown or malformed
data is ignored; it never becomes executable code.

## Local development

```bash
npm install
npm run dev
```

Validation:

```bash
npm run typecheck
npm test
npm run build
```
