export class UtilsProvider {
  static getVariableName<TResult>(getVar: () => TResult): any {
    const m = /\(\)=>(.*)/.exec(
      getVar.toString().replace(/(\r\n|\n|\r|\s)/gm, ''),
    );

    if (!m) {
      throw new Error(
        "The function does not contain a statement matching 'return variableName;'",
      );
    }
  }
}
