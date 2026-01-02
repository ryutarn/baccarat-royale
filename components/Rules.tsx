import React from 'react';

const Rules: React.FC = () => {
  return (
    <div className="h-full bg-black/20 backdrop-blur-md p-4 border-l border-white/10 overflow-y-auto text-gray-300 scrollbar-hide">
      <h2 className="text-lg font-serif font-bold text-gold border-b border-white/10 pb-2 mb-4 sticky top-0 bg-[#224433] z-10">ルール概要</h2>
      
      <div className="space-y-6 text-xs sm:text-sm">
        
        {/* Payouts */}
        <section>
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-gold block"></span>
            配当 (Payout)
          </h3>
          <table className="w-full text-left border-collapse">
            <tbody>
              <tr className="border-b border-white/10">
                <td className="py-1">PLAYER</td>
                <td className="py-1 text-right font-bold text-blue-400">1 : 1</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-1">BANKER</td>
                <td className="py-1 text-right font-bold text-red-400">1 : 1 <span className="text-[10px] font-normal text-gray-400 ml-1">(No Comm)</span></td>
              </tr>
              <tr>
                <td className="py-1">TIE</td>
                <td className="py-1 text-right font-bold text-green-400">8 : 1</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Card Values */}
        <section>
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-gold block"></span>
            カードの点数
          </h3>
          <div className="flex gap-2">
            <div className="bg-white/5 flex-1 p-2 rounded text-center border border-white/10">
              <div className="text-gold font-bold text-lg">A = 1</div>
            </div>
            <div className="bg-white/5 flex-1 p-2 rounded text-center border border-white/10">
              <div className="text-gold font-bold text-lg">2-9</div>
              <div className="text-[10px]">数字通り</div>
            </div>
            <div className="bg-white/5 flex-1 p-2 rounded text-center border border-white/10">
              <div className="text-gold font-bold text-lg">10, JQK</div>
              <div className="text-[10px]">0点</div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-gray-400">
            ※合計値の「下一桁」がスコアとなります。<br/>
            例: 7 + 5 = 12 → スコアは 2
          </p>
        </section>

        {/* 3rd Card Rules */}
        <section>
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-gold block"></span>
            3枚目のカードルール
          </h3>
          
          <div className="mb-4">
            <h4 className="font-bold text-blue-300 mb-1">■ プレイヤー (Player)</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li><span className="text-white font-bold">0 - 5点</span> : 引く (Draw)</li>
              <li><span className="text-white font-bold">6 - 7点</span> : スタンド (Stand)</li>
              <li><span className="text-white font-bold">8 - 9点</span> : ナチュラル (即決着)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-red-300 mb-2">■ バンカー (Banker)</h4>
            <p className="mb-2">プレイヤーがスタンドした場合、バンカーは<span className="text-white font-bold">5以下で引き、6以上でスタンド</span>します。</p>
            <p className="mb-2">プレイヤーが3枚目を引いた場合、以下の表に従います。</p>
            
            <table className="w-full text-[10px] border border-white/20 text-center">
              <thead className="bg-white/10 text-white">
                <tr>
                  <th className="p-1 border-r border-white/20">バンカー<br/>合計</th>
                  <th className="p-1">プレイヤーの3枚目が<br/>以下の時「引く」 (Draw)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="font-bold p-1 border-r border-white/10">0 - 2</td>
                  <td className="p-1 text-gold">常に引く</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="font-bold p-1 border-r border-white/10">3</td>
                  <td className="p-1">8 以外</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="font-bold p-1 border-r border-white/10">4</td>
                  <td className="p-1">2, 3, 4, 5, 6, 7</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="font-bold p-1 border-r border-white/10">5</td>
                  <td className="p-1">4, 5, 6, 7</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="font-bold p-1 border-r border-white/10">6</td>
                  <td className="p-1">6, 7</td>
                </tr>
                <tr>
                  <td className="font-bold p-1 border-r border-white/10">7</td>
                  <td className="p-1 text-gray-500">常にスタンド (Stand)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Rules;