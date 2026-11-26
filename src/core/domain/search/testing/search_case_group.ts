import { Fruit } from "@/core/domain/search/testing/fruit";

type SearchCaseAssertion = (query: string, expectedFruitNames: Fruit["name"][]) => void;
type SearchCase = { query: string; expectedFruitNames: Fruit["name"][] };
export type SearchCaseGroup = { name: string; cases?: SearchCase[]; run?: (assert: SearchCaseAssertion) => void; isAST?: boolean };
