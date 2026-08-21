const fs = require('fs');
const path = 'components/pr/component/sub-components/ExpandableRow.tsx';
let content = fs.readFileSync(path, 'utf8');

const sisaBudgetBlockOld = `{pr.uangMuka?.[0]?.pertanggungjawaban?.[0] && (
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
                                )}`;

if (content.includes(sisaBudgetBlockOld)) {
    content = content.replace(sisaBudgetBlockOld, "");
    
    // Now add it to the Rincian LPP column
    const rincianLppOld = `<TableCell className="font-semibold text-right max-w-[20px]">
                            {pr.uangMuka?.[0]?.pertanggungjawaban?.[0]?.details?.length ? (
                                <Badge variant="outline" className="ml-2">
                                    {
                                        pr.uangMuka[0].pertanggungjawaban[0].details
                                            ?.length
                                    }{" "}
                                    rincian LPP
                                </Badge>
                            ) : null}
                        </TableCell>`;
                        
    const rincianLppNew = `<TableCell className="font-semibold text-right max-w-[20px]">
                            <div className="flex flex-col items-end gap-1.5">
                                {pr.uangMuka?.[0]?.pertanggungjawaban?.[0]?.details?.length ? (
                                    <Badge variant="outline" className="ml-2">
                                        {pr.uangMuka[0].pertanggungjawaban[0].details?.length} rincian LPP
                                    </Badge>
                                ) : null}
                                
                                {pr.uangMuka?.[0]?.pertanggungjawaban?.[0] && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-bold text-gray-500 mb-0.5">Selisih LPP:</span>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-bold tabular-nums py-1 px-2 border whitespace-nowrap text-[10px]",
                                                Number(pr.uangMuka[0].pertanggungjawaban[0].sisaUangDikembalikan) < 0
                                                    ? "bg-rose-100 text-rose-800 border-rose-300"
                                                    : "bg-amber-100 text-amber-800 border-amber-300"
                                            )}
                                        >
                                            {formatCurrency(Number(pr.uangMuka[0].pertanggungjawaban[0].sisaUangDikembalikan) || 0)}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </TableCell>`;
                        
    if (content.includes(rincianLppOld)) {
        content = content.replace(rincianLppOld, rincianLppNew);
        fs.writeFileSync(path, content, 'utf8');
        console.log('Successfully moved LPP Selisih');
    } else {
        console.log('Could not find Rincian LPP block to replace');
    }
} else {
    console.log('Could not find Selisih LPP block to remove');
}
