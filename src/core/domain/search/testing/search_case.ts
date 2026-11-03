import { FruitName } from "@/core/domain/search/testing/fruit";

export type SearchCaseAssertion = (query: string, expectedFruitNames: FruitName[]) => void;
type SearchCase = { query: string; expectedFruitNames: FruitName[] };
export type SearchCaseGroup = { name: string; cases?: SearchCase[]; run?: (assert: SearchCaseAssertion) => void; isAST?: boolean };
