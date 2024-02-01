/* AutoGenerated Code, changes may be overwritten
* INPUT GRAMMAR:
* complete_expression :=
* 	value={compound_expression | wrapped_expression | simple_expression} $
* compound_expression :=
* 	and_expression | or_expression
* and_expression :=
* 	whitespace? left={compound_expression | wrapped_expression | simple_expression} AND right={compound_expression | wrapped_expression | simple_expression} whitespace?
* or_expression :=
* 	whitespace? left={compound_expression | wrapped_expression | simple_expression} OR right={compound_expression | wrapped_expression | simple_expression} whitespace?
* simple_expression :=
* 	license_ref_expression | license_id_expression
* license_ref_expression :=
* 	document_ref=document_ref_id ':' license_ref=license_ref_id exception=license_exception? |
* 	license_ref=license_ref_id exception=license_exception?
* license_id_expression :=
* 	license=license_id exception=license_exception?
* wrapped_expression :=
* 	'\(' whitespace? value={compound_expression | wrapped_expression | simple_expression} whitespace? '\)'
* license_exception :=
* 	WITH exception=idstring
* license_ref :=
* 	document_ref={prefix='DocumentRef-' value=idstring} ':' license_ref={prefix='LicenseRef-' value=idstring} |
* 	license_ref={prefix='LicenseRef-' value=idstring}
* WITH := whitespace 'WITH' whitespace
* AND := whitespace 'AND' whitespace
* OR := whitespace 'OR' whitespace
* whitespace := '[\s\t\n]+'
* license_ref_id := prefix='LicenseRef-' value='[a-zA-Z0-9\-\.]+'
* document_ref_id := prefix='DocumentRef-' value='[a-zA-Z0-9\-\.]+'
* idstring := '[a-zA-Z0-9 ][a-zA-Z0-9\.\-]*[a-zA-Z0-9]+\+?\+?'
* license_id := license=idstring '\+'?
*/
type Nullable<T> = T | null;
type $$RuleType<T> = () => Nullable<T>;
export interface ASTNodeIntf {
    kind: ASTKinds;
}
export enum ASTKinds {
    complete_expression = "complete_expression",
    complete_expression_$0_1 = "complete_expression_$0_1",
    complete_expression_$0_2 = "complete_expression_$0_2",
    complete_expression_$0_3 = "complete_expression_$0_3",
    compound_expression_1 = "compound_expression_1",
    compound_expression_2 = "compound_expression_2",
    and_expression = "and_expression",
    and_expression_$0_1 = "and_expression_$0_1",
    and_expression_$0_2 = "and_expression_$0_2",
    and_expression_$0_3 = "and_expression_$0_3",
    and_expression_$1_1 = "and_expression_$1_1",
    and_expression_$1_2 = "and_expression_$1_2",
    and_expression_$1_3 = "and_expression_$1_3",
    or_expression = "or_expression",
    or_expression_$0_1 = "or_expression_$0_1",
    or_expression_$0_2 = "or_expression_$0_2",
    or_expression_$0_3 = "or_expression_$0_3",
    or_expression_$1_1 = "or_expression_$1_1",
    or_expression_$1_2 = "or_expression_$1_2",
    or_expression_$1_3 = "or_expression_$1_3",
    simple_expression_1 = "simple_expression_1",
    simple_expression_2 = "simple_expression_2",
    license_ref_expression_1 = "license_ref_expression_1",
    license_ref_expression_2 = "license_ref_expression_2",
    license_id_expression = "license_id_expression",
    wrapped_expression = "wrapped_expression",
    wrapped_expression_$0_1 = "wrapped_expression_$0_1",
    wrapped_expression_$0_2 = "wrapped_expression_$0_2",
    wrapped_expression_$0_3 = "wrapped_expression_$0_3",
    license_exception = "license_exception",
    license_ref_1 = "license_ref_1",
    license_ref_2 = "license_ref_2",
    license_ref_$0 = "license_ref_$0",
    license_ref_$1 = "license_ref_$1",
    license_ref_$2 = "license_ref_$2",
    WITH = "WITH",
    AND = "AND",
    OR = "OR",
    whitespace = "whitespace",
    license_ref_id = "license_ref_id",
    document_ref_id = "document_ref_id",
    idstring = "idstring",
    license_id = "license_id",
    $EOF = "$EOF",
}
export interface complete_expression {
    kind: ASTKinds.complete_expression;
    value: complete_expression_$0;
}
export type complete_expression_$0 = complete_expression_$0_1 | complete_expression_$0_2 | complete_expression_$0_3;
export type complete_expression_$0_1 = compound_expression;
export type complete_expression_$0_2 = wrapped_expression;
export type complete_expression_$0_3 = simple_expression;
export type compound_expression = compound_expression_1 | compound_expression_2;
export type compound_expression_1 = and_expression;
export type compound_expression_2 = or_expression;
export interface and_expression {
    kind: ASTKinds.and_expression;
    left: and_expression_$0;
    right: and_expression_$1;
}
export type and_expression_$0 = and_expression_$0_1 | and_expression_$0_2 | and_expression_$0_3;
export type and_expression_$0_1 = compound_expression;
export type and_expression_$0_2 = wrapped_expression;
export type and_expression_$0_3 = simple_expression;
export type and_expression_$1 = and_expression_$1_1 | and_expression_$1_2 | and_expression_$1_3;
export type and_expression_$1_1 = compound_expression;
export type and_expression_$1_2 = wrapped_expression;
export type and_expression_$1_3 = simple_expression;
export interface or_expression {
    kind: ASTKinds.or_expression;
    left: or_expression_$0;
    right: or_expression_$1;
}
export type or_expression_$0 = or_expression_$0_1 | or_expression_$0_2 | or_expression_$0_3;
export type or_expression_$0_1 = compound_expression;
export type or_expression_$0_2 = wrapped_expression;
export type or_expression_$0_3 = simple_expression;
export type or_expression_$1 = or_expression_$1_1 | or_expression_$1_2 | or_expression_$1_3;
export type or_expression_$1_1 = compound_expression;
export type or_expression_$1_2 = wrapped_expression;
export type or_expression_$1_3 = simple_expression;
export type simple_expression = simple_expression_1 | simple_expression_2;
export type simple_expression_1 = license_ref_expression;
export type simple_expression_2 = license_id_expression;
export type license_ref_expression = license_ref_expression_1 | license_ref_expression_2;
export interface license_ref_expression_1 {
    kind: ASTKinds.license_ref_expression_1;
    document_ref: document_ref_id;
    license_ref: license_ref_id;
    exception: Nullable<license_exception>;
}
export interface license_ref_expression_2 {
    kind: ASTKinds.license_ref_expression_2;
    license_ref: license_ref_id;
    exception: Nullable<license_exception>;
}
export interface license_id_expression {
    kind: ASTKinds.license_id_expression;
    license: license_id;
    exception: Nullable<license_exception>;
}
export interface wrapped_expression {
    kind: ASTKinds.wrapped_expression;
    value: wrapped_expression_$0;
}
export type wrapped_expression_$0 = wrapped_expression_$0_1 | wrapped_expression_$0_2 | wrapped_expression_$0_3;
export type wrapped_expression_$0_1 = compound_expression;
export type wrapped_expression_$0_2 = wrapped_expression;
export type wrapped_expression_$0_3 = simple_expression;
export interface license_exception {
    kind: ASTKinds.license_exception;
    exception: idstring;
}
export type license_ref = license_ref_1 | license_ref_2;
export interface license_ref_1 {
    kind: ASTKinds.license_ref_1;
    document_ref: license_ref_$0;
    license_ref: license_ref_$1;
}
export interface license_ref_2 {
    kind: ASTKinds.license_ref_2;
    license_ref: license_ref_$2;
}
export interface license_ref_$0 {
    kind: ASTKinds.license_ref_$0;
    prefix: string;
    value: idstring;
}
export interface license_ref_$1 {
    kind: ASTKinds.license_ref_$1;
    prefix: string;
    value: idstring;
}
export interface license_ref_$2 {
    kind: ASTKinds.license_ref_$2;
    prefix: string;
    value: idstring;
}
export interface WITH {
    kind: ASTKinds.WITH;
}
export interface AND {
    kind: ASTKinds.AND;
}
export interface OR {
    kind: ASTKinds.OR;
}
export type whitespace = string;
export interface license_ref_id {
    kind: ASTKinds.license_ref_id;
    prefix: string;
    value: string;
}
export interface document_ref_id {
    kind: ASTKinds.document_ref_id;
    prefix: string;
    value: string;
}
export type idstring = string;
export interface license_id {
    kind: ASTKinds.license_id;
    license: idstring;
}
export class Parser {
    private readonly input: string;
    private pos: PosInfo;
    private negating: boolean = false;
    private memoSafe: boolean = true;
    constructor(input: string) {
        this.pos = {overallPos: 0, line: 1, offset: 0};
        this.input = input;
    }
    public reset(pos: PosInfo) {
        this.pos = pos;
    }
    public finished(): boolean {
        return this.pos.overallPos === this.input.length;
    }
    public clearMemos(): void {
        this.$scope$compound_expression$memo.clear();
    }
    protected $scope$compound_expression$memo: Map<number, [Nullable<compound_expression>, PosInfo]> = new Map();
    public matchcomplete_expression($$dpth: number, $$cr?: ErrorTracker): Nullable<complete_expression> {
        return this.run<complete_expression>($$dpth,
            () => {
                let $scope$value: Nullable<complete_expression_$0>;
                let $$res: Nullable<complete_expression> = null;
                if (true
                    && ($scope$value = this.matchcomplete_expression_$0($$dpth + 1, $$cr)) !== null
                    && this.match$EOF($$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.complete_expression, value: $scope$value};
                }
                return $$res;
            });
    }
    public matchcomplete_expression_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<complete_expression_$0> {
        return this.choice<complete_expression_$0>([
            () => this.matchcomplete_expression_$0_1($$dpth + 1, $$cr),
            () => this.matchcomplete_expression_$0_2($$dpth + 1, $$cr),
            () => this.matchcomplete_expression_$0_3($$dpth + 1, $$cr),
        ]);
    }
    public matchcomplete_expression_$0_1($$dpth: number, $$cr?: ErrorTracker): Nullable<complete_expression_$0_1> {
        return this.matchcompound_expression($$dpth + 1, $$cr);
    }
    public matchcomplete_expression_$0_2($$dpth: number, $$cr?: ErrorTracker): Nullable<complete_expression_$0_2> {
        return this.matchwrapped_expression($$dpth + 1, $$cr);
    }
    public matchcomplete_expression_$0_3($$dpth: number, $$cr?: ErrorTracker): Nullable<complete_expression_$0_3> {
        return this.matchsimple_expression($$dpth + 1, $$cr);
    }
    public matchcompound_expression($$dpth: number, $$cr?: ErrorTracker): Nullable<compound_expression> {
        const fn = () => {
            return this.choice<compound_expression>([
                () => this.matchcompound_expression_1($$dpth + 1, $$cr),
                () => this.matchcompound_expression_2($$dpth + 1, $$cr),
            ]);
        };
        const $scope$pos = this.mark();
        const memo = this.$scope$compound_expression$memo.get($scope$pos.overallPos);
        if(memo !== undefined) {
            this.reset(memo[1]);
            return memo[0];
        }
        const $scope$oldMemoSafe = this.memoSafe;
        this.memoSafe = false;
        this.$scope$compound_expression$memo.set($scope$pos.overallPos, [null, $scope$pos]);
        let lastRes: Nullable<compound_expression> = null;
        let lastPos: PosInfo = $scope$pos;
        for(;;) {
            this.reset($scope$pos);
            const res = fn();
            const end = this.mark();
            if(end.overallPos <= lastPos.overallPos)
                break;
            lastRes = res;
            lastPos = end;
            this.$scope$compound_expression$memo.set($scope$pos.overallPos, [lastRes, lastPos]);
        }
        this.reset(lastPos);
        this.memoSafe = $scope$oldMemoSafe;
        return lastRes;
    }
    public matchcompound_expression_1($$dpth: number, $$cr?: ErrorTracker): Nullable<compound_expression_1> {
        return this.matchand_expression($$dpth + 1, $$cr);
    }
    public matchcompound_expression_2($$dpth: number, $$cr?: ErrorTracker): Nullable<compound_expression_2> {
        return this.matchor_expression($$dpth + 1, $$cr);
    }
    public matchand_expression($$dpth: number, $$cr?: ErrorTracker): Nullable<and_expression> {
        return this.run<and_expression>($$dpth,
            () => {
                let $scope$left: Nullable<and_expression_$0>;
                let $scope$right: Nullable<and_expression_$1>;
                let $$res: Nullable<and_expression> = null;
                if (true
                    && ((this.matchwhitespace($$dpth + 1, $$cr)) || true)
                    && ($scope$left = this.matchand_expression_$0($$dpth + 1, $$cr)) !== null
                    && this.matchAND($$dpth + 1, $$cr) !== null
                    && ($scope$right = this.matchand_expression_$1($$dpth + 1, $$cr)) !== null
                    && ((this.matchwhitespace($$dpth + 1, $$cr)) || true)
                ) {
                    $$res = {kind: ASTKinds.and_expression, left: $scope$left, right: $scope$right};
                }
                return $$res;
            });
    }
    public matchand_expression_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<and_expression_$0> {
        return this.choice<and_expression_$0>([
            () => this.matchand_expression_$0_1($$dpth + 1, $$cr),
            () => this.matchand_expression_$0_2($$dpth + 1, $$cr),
            () => this.matchand_expression_$0_3($$dpth + 1, $$cr),
        ]);
    }
    public matchand_expression_$0_1($$dpth: number, $$cr?: ErrorTracker): Nullable<and_expression_$0_1> {
        return this.matchcompound_expression($$dpth + 1, $$cr);
    }
    public matchand_expression_$0_2($$dpth: number, $$cr?: ErrorTracker): Nullable<and_expression_$0_2> {
        return this.matchwrapped_expression($$dpth + 1, $$cr);
    }
    public matchand_expression_$0_3($$dpth: number, $$cr?: ErrorTracker): Nullable<and_expression_$0_3> {
        return this.matchsimple_expression($$dpth + 1, $$cr);
    }
    public matchand_expression_$1($$dpth: number, $$cr?: ErrorTracker): Nullable<and_expression_$1> {
        return this.choice<and_expression_$1>([
            () => this.matchand_expression_$1_1($$dpth + 1, $$cr),
            () => this.matchand_expression_$1_2($$dpth + 1, $$cr),
            () => this.matchand_expression_$1_3($$dpth + 1, $$cr),
        ]);
    }
    public matchand_expression_$1_1($$dpth: number, $$cr?: ErrorTracker): Nullable<and_expression_$1_1> {
        return this.matchcompound_expression($$dpth + 1, $$cr);
    }
    public matchand_expression_$1_2($$dpth: number, $$cr?: ErrorTracker): Nullable<and_expression_$1_2> {
        return this.matchwrapped_expression($$dpth + 1, $$cr);
    }
    public matchand_expression_$1_3($$dpth: number, $$cr?: ErrorTracker): Nullable<and_expression_$1_3> {
        return this.matchsimple_expression($$dpth + 1, $$cr);
    }
    public matchor_expression($$dpth: number, $$cr?: ErrorTracker): Nullable<or_expression> {
        return this.run<or_expression>($$dpth,
            () => {
                let $scope$left: Nullable<or_expression_$0>;
                let $scope$right: Nullable<or_expression_$1>;
                let $$res: Nullable<or_expression> = null;
                if (true
                    && ((this.matchwhitespace($$dpth + 1, $$cr)) || true)
                    && ($scope$left = this.matchor_expression_$0($$dpth + 1, $$cr)) !== null
                    && this.matchOR($$dpth + 1, $$cr) !== null
                    && ($scope$right = this.matchor_expression_$1($$dpth + 1, $$cr)) !== null
                    && ((this.matchwhitespace($$dpth + 1, $$cr)) || true)
                ) {
                    $$res = {kind: ASTKinds.or_expression, left: $scope$left, right: $scope$right};
                }
                return $$res;
            });
    }
    public matchor_expression_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<or_expression_$0> {
        return this.choice<or_expression_$0>([
            () => this.matchor_expression_$0_1($$dpth + 1, $$cr),
            () => this.matchor_expression_$0_2($$dpth + 1, $$cr),
            () => this.matchor_expression_$0_3($$dpth + 1, $$cr),
        ]);
    }
    public matchor_expression_$0_1($$dpth: number, $$cr?: ErrorTracker): Nullable<or_expression_$0_1> {
        return this.matchcompound_expression($$dpth + 1, $$cr);
    }
    public matchor_expression_$0_2($$dpth: number, $$cr?: ErrorTracker): Nullable<or_expression_$0_2> {
        return this.matchwrapped_expression($$dpth + 1, $$cr);
    }
    public matchor_expression_$0_3($$dpth: number, $$cr?: ErrorTracker): Nullable<or_expression_$0_3> {
        return this.matchsimple_expression($$dpth + 1, $$cr);
    }
    public matchor_expression_$1($$dpth: number, $$cr?: ErrorTracker): Nullable<or_expression_$1> {
        return this.choice<or_expression_$1>([
            () => this.matchor_expression_$1_1($$dpth + 1, $$cr),
            () => this.matchor_expression_$1_2($$dpth + 1, $$cr),
            () => this.matchor_expression_$1_3($$dpth + 1, $$cr),
        ]);
    }
    public matchor_expression_$1_1($$dpth: number, $$cr?: ErrorTracker): Nullable<or_expression_$1_1> {
        return this.matchcompound_expression($$dpth + 1, $$cr);
    }
    public matchor_expression_$1_2($$dpth: number, $$cr?: ErrorTracker): Nullable<or_expression_$1_2> {
        return this.matchwrapped_expression($$dpth + 1, $$cr);
    }
    public matchor_expression_$1_3($$dpth: number, $$cr?: ErrorTracker): Nullable<or_expression_$1_3> {
        return this.matchsimple_expression($$dpth + 1, $$cr);
    }
    public matchsimple_expression($$dpth: number, $$cr?: ErrorTracker): Nullable<simple_expression> {
        return this.choice<simple_expression>([
            () => this.matchsimple_expression_1($$dpth + 1, $$cr),
            () => this.matchsimple_expression_2($$dpth + 1, $$cr),
        ]);
    }
    public matchsimple_expression_1($$dpth: number, $$cr?: ErrorTracker): Nullable<simple_expression_1> {
        return this.matchlicense_ref_expression($$dpth + 1, $$cr);
    }
    public matchsimple_expression_2($$dpth: number, $$cr?: ErrorTracker): Nullable<simple_expression_2> {
        return this.matchlicense_id_expression($$dpth + 1, $$cr);
    }
    public matchlicense_ref_expression($$dpth: number, $$cr?: ErrorTracker): Nullable<license_ref_expression> {
        return this.choice<license_ref_expression>([
            () => this.matchlicense_ref_expression_1($$dpth + 1, $$cr),
            () => this.matchlicense_ref_expression_2($$dpth + 1, $$cr),
        ]);
    }
    public matchlicense_ref_expression_1($$dpth: number, $$cr?: ErrorTracker): Nullable<license_ref_expression_1> {
        return this.run<license_ref_expression_1>($$dpth,
            () => {
                let $scope$document_ref: Nullable<document_ref_id>;
                let $scope$license_ref: Nullable<license_ref_id>;
                let $scope$exception: Nullable<Nullable<license_exception>>;
                let $$res: Nullable<license_ref_expression_1> = null;
                if (true
                    && ($scope$document_ref = this.matchdocument_ref_id($$dpth + 1, $$cr)) !== null
                    && this.regexAccept(String.raw`(?::)`, "", $$dpth + 1, $$cr) !== null
                    && ($scope$license_ref = this.matchlicense_ref_id($$dpth + 1, $$cr)) !== null
                    && (($scope$exception = this.matchlicense_exception($$dpth + 1, $$cr)) || true)
                ) {
                    $$res = {kind: ASTKinds.license_ref_expression_1, document_ref: $scope$document_ref, license_ref: $scope$license_ref, exception: $scope$exception};
                }
                return $$res;
            });
    }
    public matchlicense_ref_expression_2($$dpth: number, $$cr?: ErrorTracker): Nullable<license_ref_expression_2> {
        return this.run<license_ref_expression_2>($$dpth,
            () => {
                let $scope$license_ref: Nullable<license_ref_id>;
                let $scope$exception: Nullable<Nullable<license_exception>>;
                let $$res: Nullable<license_ref_expression_2> = null;
                if (true
                    && ($scope$license_ref = this.matchlicense_ref_id($$dpth + 1, $$cr)) !== null
                    && (($scope$exception = this.matchlicense_exception($$dpth + 1, $$cr)) || true)
                ) {
                    $$res = {kind: ASTKinds.license_ref_expression_2, license_ref: $scope$license_ref, exception: $scope$exception};
                }
                return $$res;
            });
    }
    public matchlicense_id_expression($$dpth: number, $$cr?: ErrorTracker): Nullable<license_id_expression> {
        return this.run<license_id_expression>($$dpth,
            () => {
                let $scope$license: Nullable<license_id>;
                let $scope$exception: Nullable<Nullable<license_exception>>;
                let $$res: Nullable<license_id_expression> = null;
                if (true
                    && ($scope$license = this.matchlicense_id($$dpth + 1, $$cr)) !== null
                    && (($scope$exception = this.matchlicense_exception($$dpth + 1, $$cr)) || true)
                ) {
                    $$res = {kind: ASTKinds.license_id_expression, license: $scope$license, exception: $scope$exception};
                }
                return $$res;
            });
    }
    public matchwrapped_expression($$dpth: number, $$cr?: ErrorTracker): Nullable<wrapped_expression> {
        return this.run<wrapped_expression>($$dpth,
            () => {
                let $scope$value: Nullable<wrapped_expression_$0>;
                let $$res: Nullable<wrapped_expression> = null;
                if (true
                    && this.regexAccept(String.raw`(?:\()`, "", $$dpth + 1, $$cr) !== null
                    && ((this.matchwhitespace($$dpth + 1, $$cr)) || true)
                    && ($scope$value = this.matchwrapped_expression_$0($$dpth + 1, $$cr)) !== null
                    && ((this.matchwhitespace($$dpth + 1, $$cr)) || true)
                    && this.regexAccept(String.raw`(?:\))`, "", $$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.wrapped_expression, value: $scope$value};
                }
                return $$res;
            });
    }
    public matchwrapped_expression_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<wrapped_expression_$0> {
        return this.choice<wrapped_expression_$0>([
            () => this.matchwrapped_expression_$0_1($$dpth + 1, $$cr),
            () => this.matchwrapped_expression_$0_2($$dpth + 1, $$cr),
            () => this.matchwrapped_expression_$0_3($$dpth + 1, $$cr),
        ]);
    }
    public matchwrapped_expression_$0_1($$dpth: number, $$cr?: ErrorTracker): Nullable<wrapped_expression_$0_1> {
        return this.matchcompound_expression($$dpth + 1, $$cr);
    }
    public matchwrapped_expression_$0_2($$dpth: number, $$cr?: ErrorTracker): Nullable<wrapped_expression_$0_2> {
        return this.matchwrapped_expression($$dpth + 1, $$cr);
    }
    public matchwrapped_expression_$0_3($$dpth: number, $$cr?: ErrorTracker): Nullable<wrapped_expression_$0_3> {
        return this.matchsimple_expression($$dpth + 1, $$cr);
    }
    public matchlicense_exception($$dpth: number, $$cr?: ErrorTracker): Nullable<license_exception> {
        return this.run<license_exception>($$dpth,
            () => {
                let $scope$exception: Nullable<idstring>;
                let $$res: Nullable<license_exception> = null;
                if (true
                    && this.matchWITH($$dpth + 1, $$cr) !== null
                    && ($scope$exception = this.matchidstring($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.license_exception, exception: $scope$exception};
                }
                return $$res;
            });
    }
    public matchlicense_ref($$dpth: number, $$cr?: ErrorTracker): Nullable<license_ref> {
        return this.choice<license_ref>([
            () => this.matchlicense_ref_1($$dpth + 1, $$cr),
            () => this.matchlicense_ref_2($$dpth + 1, $$cr),
        ]);
    }
    public matchlicense_ref_1($$dpth: number, $$cr?: ErrorTracker): Nullable<license_ref_1> {
        return this.run<license_ref_1>($$dpth,
            () => {
                let $scope$document_ref: Nullable<license_ref_$0>;
                let $scope$license_ref: Nullable<license_ref_$1>;
                let $$res: Nullable<license_ref_1> = null;
                if (true
                    && ($scope$document_ref = this.matchlicense_ref_$0($$dpth + 1, $$cr)) !== null
                    && this.regexAccept(String.raw`(?::)`, "", $$dpth + 1, $$cr) !== null
                    && ($scope$license_ref = this.matchlicense_ref_$1($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.license_ref_1, document_ref: $scope$document_ref, license_ref: $scope$license_ref};
                }
                return $$res;
            });
    }
    public matchlicense_ref_2($$dpth: number, $$cr?: ErrorTracker): Nullable<license_ref_2> {
        return this.run<license_ref_2>($$dpth,
            () => {
                let $scope$license_ref: Nullable<license_ref_$2>;
                let $$res: Nullable<license_ref_2> = null;
                if (true
                    && ($scope$license_ref = this.matchlicense_ref_$2($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.license_ref_2, license_ref: $scope$license_ref};
                }
                return $$res;
            });
    }
    public matchlicense_ref_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<license_ref_$0> {
        return this.run<license_ref_$0>($$dpth,
            () => {
                let $scope$prefix: Nullable<string>;
                let $scope$value: Nullable<idstring>;
                let $$res: Nullable<license_ref_$0> = null;
                if (true
                    && ($scope$prefix = this.regexAccept(String.raw`(?:DocumentRef-)`, "", $$dpth + 1, $$cr)) !== null
                    && ($scope$value = this.matchidstring($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.license_ref_$0, prefix: $scope$prefix, value: $scope$value};
                }
                return $$res;
            });
    }
    public matchlicense_ref_$1($$dpth: number, $$cr?: ErrorTracker): Nullable<license_ref_$1> {
        return this.run<license_ref_$1>($$dpth,
            () => {
                let $scope$prefix: Nullable<string>;
                let $scope$value: Nullable<idstring>;
                let $$res: Nullable<license_ref_$1> = null;
                if (true
                    && ($scope$prefix = this.regexAccept(String.raw`(?:LicenseRef-)`, "", $$dpth + 1, $$cr)) !== null
                    && ($scope$value = this.matchidstring($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.license_ref_$1, prefix: $scope$prefix, value: $scope$value};
                }
                return $$res;
            });
    }
    public matchlicense_ref_$2($$dpth: number, $$cr?: ErrorTracker): Nullable<license_ref_$2> {
        return this.run<license_ref_$2>($$dpth,
            () => {
                let $scope$prefix: Nullable<string>;
                let $scope$value: Nullable<idstring>;
                let $$res: Nullable<license_ref_$2> = null;
                if (true
                    && ($scope$prefix = this.regexAccept(String.raw`(?:LicenseRef-)`, "", $$dpth + 1, $$cr)) !== null
                    && ($scope$value = this.matchidstring($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.license_ref_$2, prefix: $scope$prefix, value: $scope$value};
                }
                return $$res;
            });
    }
    public matchWITH($$dpth: number, $$cr?: ErrorTracker): Nullable<WITH> {
        return this.run<WITH>($$dpth,
            () => {
                let $$res: Nullable<WITH> = null;
                if (true
                    && this.matchwhitespace($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:WITH)`, "", $$dpth + 1, $$cr) !== null
                    && this.matchwhitespace($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.WITH, };
                }
                return $$res;
            });
    }
    public matchAND($$dpth: number, $$cr?: ErrorTracker): Nullable<AND> {
        return this.run<AND>($$dpth,
            () => {
                let $$res: Nullable<AND> = null;
                if (true
                    && this.matchwhitespace($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:AND)`, "", $$dpth + 1, $$cr) !== null
                    && this.matchwhitespace($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.AND, };
                }
                return $$res;
            });
    }
    public matchOR($$dpth: number, $$cr?: ErrorTracker): Nullable<OR> {
        return this.run<OR>($$dpth,
            () => {
                let $$res: Nullable<OR> = null;
                if (true
                    && this.matchwhitespace($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:OR)`, "", $$dpth + 1, $$cr) !== null
                    && this.matchwhitespace($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.OR, };
                }
                return $$res;
            });
    }
    public matchwhitespace($$dpth: number, $$cr?: ErrorTracker): Nullable<whitespace> {
        return this.regexAccept(String.raw`(?:[\s\t\n]+)`, "", $$dpth + 1, $$cr);
    }
    public matchlicense_ref_id($$dpth: number, $$cr?: ErrorTracker): Nullable<license_ref_id> {
        return this.run<license_ref_id>($$dpth,
            () => {
                let $scope$prefix: Nullable<string>;
                let $scope$value: Nullable<string>;
                let $$res: Nullable<license_ref_id> = null;
                if (true
                    && ($scope$prefix = this.regexAccept(String.raw`(?:LicenseRef-)`, "", $$dpth + 1, $$cr)) !== null
                    && ($scope$value = this.regexAccept(String.raw`(?:[a-zA-Z0-9\-\.]+)`, "", $$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.license_ref_id, prefix: $scope$prefix, value: $scope$value};
                }
                return $$res;
            });
    }
    public matchdocument_ref_id($$dpth: number, $$cr?: ErrorTracker): Nullable<document_ref_id> {
        return this.run<document_ref_id>($$dpth,
            () => {
                let $scope$prefix: Nullable<string>;
                let $scope$value: Nullable<string>;
                let $$res: Nullable<document_ref_id> = null;
                if (true
                    && ($scope$prefix = this.regexAccept(String.raw`(?:DocumentRef-)`, "", $$dpth + 1, $$cr)) !== null
                    && ($scope$value = this.regexAccept(String.raw`(?:[a-zA-Z0-9\-\.]+)`, "", $$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.document_ref_id, prefix: $scope$prefix, value: $scope$value};
                }
                return $$res;
            });
    }
    public matchidstring($$dpth: number, $$cr?: ErrorTracker): Nullable<idstring> {
        return this.regexAccept(String.raw`(?:[a-zA-Z0-9 ][a-zA-Z0-9\.\-]*[a-zA-Z0-9]+\+?\+?)`, "", $$dpth + 1, $$cr);
    }
    public matchlicense_id($$dpth: number, $$cr?: ErrorTracker): Nullable<license_id> {
        return this.run<license_id>($$dpth,
            () => {
                let $scope$license: Nullable<idstring>;
                let $$res: Nullable<license_id> = null;
                if (true
                    && ($scope$license = this.matchidstring($$dpth + 1, $$cr)) !== null
                    && ((this.regexAccept(String.raw`(?:\+)`, "", $$dpth + 1, $$cr)) || true)
                ) {
                    $$res = {kind: ASTKinds.license_id, license: $scope$license};
                }
                return $$res;
            });
    }
    public test(): boolean {
        const mrk = this.mark();
        const res = this.matchcomplete_expression(0);
        const ans = res !== null;
        this.reset(mrk);
        return ans;
    }
    public parse(): ParseResult {
        const mrk = this.mark();
        const res = this.matchcomplete_expression(0);
        if (res)
            return {ast: res, errs: []};
        this.reset(mrk);
        const rec = new ErrorTracker();
        this.clearMemos();
        this.matchcomplete_expression(0, rec);
        const err = rec.getErr()
        return {ast: res, errs: err !== null ? [err] : []}
    }
    public mark(): PosInfo {
        return this.pos;
    }
    // @ts-ignore: loopPlus may not be called
    private loopPlus<T>(func: $$RuleType<T>): Nullable<[T, ...T[]]> {
        return this.loop(func, 1, -1) as Nullable<[T, ...T[]]>;
    }
    private loop<T>(func: $$RuleType<T>, lb: number, ub: number): Nullable<T[]> {
        const mrk = this.mark();
        const res: T[] = [];
        while (ub === -1 || res.length < ub) {
            const preMrk = this.mark();
            const t = func();
            if (t === null || this.pos.overallPos === preMrk.overallPos) {
                break;
            }
            res.push(t);
        }
        if (res.length >= lb) {
            return res;
        }
        this.reset(mrk);
        return null;
    }
    private run<T>($$dpth: number, fn: $$RuleType<T>): Nullable<T> {
        const mrk = this.mark();
        const res = fn()
        if (res !== null)
            return res;
        this.reset(mrk);
        return null;
    }
    // @ts-ignore: choice may not be called
    private choice<T>(fns: Array<$$RuleType<T>>): Nullable<T> {
        for (const f of fns) {
            const res = f();
            if (res !== null) {
                return res;
            }
        }
        return null;
    }
    private regexAccept(match: string, mods: string, dpth: number, cr?: ErrorTracker): Nullable<string> {
        return this.run<string>(dpth,
            () => {
                const reg = new RegExp(match, "y" + mods);
                const mrk = this.mark();
                reg.lastIndex = mrk.overallPos;
                const res = this.tryConsume(reg);
                if(cr) {
                    cr.record(mrk, res, {
                        kind: "RegexMatch",
                        // We substring from 3 to len - 1 to strip off the
                        // non-capture group syntax added as a WebKit workaround
                        literal: match.substring(3, match.length - 1),
                        negated: this.negating,
                    });
                }
                return res;
            });
    }
    private tryConsume(reg: RegExp): Nullable<string> {
        const res = reg.exec(this.input);
        if (res) {
            let lineJmp = 0;
            let lind = -1;
            for (let i = 0; i < res[0].length; ++i) {
                if (res[0][i] === "\n") {
                    ++lineJmp;
                    lind = i;
                }
            }
            this.pos = {
                overallPos: reg.lastIndex,
                line: this.pos.line + lineJmp,
                offset: lind === -1 ? this.pos.offset + res[0].length : (res[0].length - lind - 1)
            };
            return res[0];
        }
        return null;
    }
    // @ts-ignore: noConsume may not be called
    private noConsume<T>(fn: $$RuleType<T>): Nullable<T> {
        const mrk = this.mark();
        const res = fn();
        this.reset(mrk);
        return res;
    }
    // @ts-ignore: negate may not be called
    private negate<T>(fn: $$RuleType<T>): Nullable<boolean> {
        const mrk = this.mark();
        const oneg = this.negating;
        this.negating = !oneg;
        const res = fn();
        this.negating = oneg;
        this.reset(mrk);
        return res === null ? true : null;
    }
    // @ts-ignore: Memoise may not be used
    private memoise<K>(rule: $$RuleType<K>, memo: Map<number, [Nullable<K>, PosInfo]>): Nullable<K> {
        const $scope$pos = this.mark();
        const $scope$memoRes = memo.get($scope$pos.overallPos);
        if(this.memoSafe && $scope$memoRes !== undefined) {
        this.reset($scope$memoRes[1]);
        return $scope$memoRes[0];
        }
        const $scope$result = rule();
        if(this.memoSafe)
        memo.set($scope$pos.overallPos, [$scope$result, this.mark()]);
        return $scope$result;
    }
    private match$EOF(et?: ErrorTracker): Nullable<{kind: ASTKinds.$EOF}> {
        const res: {kind: ASTKinds.$EOF} | null = this.finished() ? { kind: ASTKinds.$EOF } : null;
        if(et)
            et.record(this.mark(), res, { kind: "EOF", negated: this.negating });
        return res;
    }
}
export function parse(s: string): ParseResult {
    const p = new Parser(s);
    return p.parse();
}
export interface ParseResult {
    ast: Nullable<complete_expression>;
    errs: SyntaxErr[];
}
export interface PosInfo {
    readonly overallPos: number;
    readonly line: number;
    readonly offset: number;
}
export interface RegexMatch {
    readonly kind: "RegexMatch";
    readonly negated: boolean;
    readonly literal: string;
}
export type EOFMatch = { kind: "EOF"; negated: boolean };
export type MatchAttempt = RegexMatch | EOFMatch;
export class SyntaxErr {
    public pos: PosInfo;
    public expmatches: MatchAttempt[];
    constructor(pos: PosInfo, expmatches: MatchAttempt[]) {
        this.pos = pos;
        this.expmatches = [...expmatches];
    }
    public toString(): string {
        return `Syntax Error at line ${this.pos.line}:${this.pos.offset}. Expected one of ${this.expmatches.map(x => x.kind === "EOF" ? " EOF" : ` ${x.negated ? 'not ': ''}'${x.literal}'`)}`;
    }
}
class ErrorTracker {
    private mxpos: PosInfo = {overallPos: -1, line: -1, offset: -1};
    private regexset: Set<string> = new Set();
    private pmatches: MatchAttempt[] = [];
    public record(pos: PosInfo, result: any, att: MatchAttempt) {
        if ((result === null) === att.negated)
            return;
        if (pos.overallPos > this.mxpos.overallPos) {
            this.mxpos = pos;
            this.pmatches = [];
            this.regexset.clear()
        }
        if (this.mxpos.overallPos === pos.overallPos) {
            if(att.kind === "RegexMatch") {
                if(!this.regexset.has(att.literal))
                    this.pmatches.push(att);
                this.regexset.add(att.literal);
            } else {
                this.pmatches.push(att);
            }
        }
    }
    public getErr(): SyntaxErr | null {
        if (this.mxpos.overallPos !== -1)
            return new SyntaxErr(this.mxpos, this.pmatches);
        return null;
    }
}