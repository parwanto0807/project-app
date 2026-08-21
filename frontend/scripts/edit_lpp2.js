const fs = require('fs');
const path = 'components/pr/component/sub-components/ExpandableRow.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldStr = `<Badge
                                      variant="outline"
                                      className={cn(
                                          "font-bold tabular-nums py-1.5 px-3 border-2 shadow-sm whitespace-nowrap",
                                          (pr.sisaBudget ?? 0) < 0
                                              ? "bg-rose-50 text-rose-700 border-rose-200"
                                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      )}
                                  >
                                      {formatCurrency(pr.sisaBudget ?? 0)}
                                  </Badge>
                                  {pr.status === 'COMPLETED' && (
                                      <button
                                          className="h-6 px-2 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 
text-white rounded-md transition-colors shadow-sm whitespace-nowrap"
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              if (onSettleBudget) onSettleBudget(pr.id);
                                          }}
                                      >
                                          Settle Budget
                                      </button>
                                  )}
                                  <span className="text-[9px] text-muted-foreground italic">Database Linked</span>`;

const newStr = `<Badge
                                      variant="outline"
                                      className={cn(
                                          "font-bold tabular-nums py-1.5 px-3 border-2 shadow-sm whitespace-nowrap",
                                          (pr.sisaBudget ?? 0) < 0
                                              ? "bg-rose-50 text-rose-700 border-rose-200"
                                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      )}
                                  >
                                      {formatCurrency(pr.sisaBudget ?? 0)}
                                  </Badge>

                                  {pr.uangMuka?.[0]?.pertanggungjawaban?.[0] && (
                                      <div className="flex flex-col items-end mt-1">
                                          <span className="text-[10px] font-bold text-gray-500 mb-0.5">Selisih LPP:</span>
                                          <Badge
                                              variant="outline"
                                              className={cn(
                                                  "font-bold tabular-nums py-1 px-2 border whitespace-nowrap text-[11px]",
                                                  Number(pr.uangMuka[0].pertanggungjawaban[0].sisaUangDikembalikan) < 0
                                                      ? "bg-rose-100 text-rose-800 border-rose-300"
                                                      : "bg-amber-100 text-amber-800 border-amber-300"
                                              )}
                                          >
                                              {formatCurrency(Number(pr.uangMuka[0].pertanggungjawaban[0].sisaUangDikembalikan) || 0)}
                                          </Badge>
                                      </div>
                                  )}

                                  {pr.status === 'COMPLETED' && !pr.uangMuka?.[0]?.pertanggungjawaban?.[0] && (
                                      <button
                                          className="h-6 px-2 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm whitespace-nowrap mt-1"
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              if (onSettleBudget) onSettleBudget(pr.id);
                                          }}
                                      >
                                          Settle Budget
                                      </button>
                                  )}
                                  <span className="text-[9px] text-muted-foreground italic mt-1">Database Linked</span>`;

if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Replaced successfully');
} else {
    console.log('Could not find old string.');
}
