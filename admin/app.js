import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    onSnapshot,
    updateDoc,
    doc,
    getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================
   FIREBASE
========================= */

const firebaseConfig = {

    apiKey: "AIzaSyAbAPR1iIWlX3pnPt6pS7NIFrpbVeA3xH4",
  authDomain: "delivery-da-vivi.firebaseapp.com",
  projectId: "delivery-da-vivi",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

const pedidosDiv =
    document.getElementById("pedidos");


/* =========================
   PROTEGER PAINEL
========================= */

onAuthStateChanged(auth, (user) => {

    if(!user){

        window.location.href = "login.html";

        return;
    }

    console.log("Admin logado");

    carregarPedidos();
});


/* =========================
   SEGURANÇA HTML
========================= */

function escapeHTML(text){

    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================
   FLUXO STATUS
========================= */

const STATUS_FLOW = {

    "Novo": "Em preparo",

    "Em preparo": "Saiu para entrega",

    "Saiu para entrega": "Entregue",

    "Entregue": "Entregue"
};


/* =========================
   CORES STATUS
========================= */

function getStatusClass(status){

    if(status === "Novo"){
        return "status-novo";
    }

    if(status === "Em preparo"){
        return "status-preparo";
    }

    if(status === "Saiu para entrega"){
        return "status-entrega";
    }

    if(status === "Entregue"){
        return "status-finalizado";
    }

    return "";
}


/* =========================
   CARREGAR PEDIDOS
========================= */

function carregarPedidos(){

    onSnapshot(collection(db, "pedidos"), (snapshot) => {

        pedidosDiv.innerHTML = "";

        const pedidosOrdenados =
            snapshot.docs.sort((a, b) => {

                const dataA =
                    a.data().data?.seconds || 0;

                const dataB =
                    b.data().data?.seconds || 0;

                return dataB - dataA;
            });

        pedidosOrdenados.forEach((docSnap) => {

            const p = docSnap.data();
                const retirada =
        p.entrega?.toLowerCase()
        .includes("retirada");

            if(p.arquivado) return;

            const status =
                p.status || "Novo";

            const statusClass =
                getStatusClass(status);

            const dataPedido =
                p.data?.toDate();

            const horario =
                dataPedido
                ? dataPedido.toLocaleTimeString("pt-BR")
                : "-";

            const dataFormatada =
                dataPedido
                ? dataPedido.toLocaleDateString("pt-BR")
                : "-";

            pedidosDiv.innerHTML += `

           <div class="pedido">

    <h2>
        🍕 Pedido #${docSnap.id}
    </h2>

    <p>
        <b>Data:</b>
        ${dataFormatada}
    </p>

    <p>
        <b>Horário:</b>
        ${horario}
    </p>

    <p>
        <b>Recebido por:</b>
        ${escapeHTML(p.loja || "vivi")}
    </p>

    <hr>

    <p>
        <b>Cliente:</b>
        ${escapeHTML(p.nome || "Cliente sem nome")}
    </p>

    <p>
        <b>Telefone:</b>
        ${escapeHTML(p.telefone || "-")}
    </p>

    <hr>

    <p>

        <b>Entrega:</b>

        ${
            p.entrega === "retirada"

            ? "🛍️ Cliente vai retirar no local"

            : "🚚 Entregar no endereço do cliente"
        }

    </p>

    ${
        p.entrega === "!retirada"

        ? `

        <p>
            <b>📍 Endereço:</b>
            ${escapeHTML(p.endereco || "-")}
        </p>

        <p>
            <b>🏠 Complemento:</b>
            ${escapeHTML(p.complemento || "-")}
        </p>

        <p>
            <b>🚚 Frete:</b>
            R$ ${Number(p.frete || 0).toFixed(2)}
        </p>

        `

        : `

        <div class="retirada-box">

            <p>
                
            </p>

            <p>
               
            </p>

            <p>
                <b> Frete:</b>
                R$ 0,00
            </p>

        </div>

        `
    }

    <div class="obs-box">

        <b>📝 Observações:</b>

        <br><br>

        ${
            escapeHTML(
                p.observacoes ||
                "Nenhuma observação"
            )
        }

    </div>
                <hr>

                <p>
                    <b>Pagamento:</b>
                    ${escapeHTML(p.pagamento || "-")}
                </p>

                <p>
                    <b>Troco:</b>

                    ${
                        p.troco
                        ? "R$ " + escapeHTML(p.troco)
                        : "Não precisa"
                    }
                </p>

                <hr>

                <p>
                    <b>Itens:</b>
                </p>

                <ul>

                    ${(p.itens || []).map(i => `

                        <li>
                            ${escapeHTML(i.quantity)}x
                            ${escapeHTML(i.name)}
                            -
                            R$ ${(i.price * i.quantity).toFixed(2)}
                        </li>

                    `).join("")}

                </ul>

                <div class="total">

                    TOTAL:
                    R$ ${(p.total || 0).toFixed(2)}

                </div>

                <br>

                <p>

                    <b>Status:</b>

                    <span class="${statusClass}">
                        ${escapeHTML(status)}
                    </span>

                </p>

                <div class="botoes">

                    <button onclick="imprimirPedido('${docSnap.id}')">
                        🖨 Imprimir
                    </button>

                    <button onclick="avancarStatus('${docSnap.id}', '${status}')">
                        🚚 Avançar
                    </button>

                    <button onclick="entregue('${docSnap.id}')">
                        ✅ Entregue
                    </button>

                    <button onclick="arquivar('${docSnap.id}')">
                        📦 Arquivar
                    </button>

                </div>

            </div>
            `;
        });
    });
}


/* =========================
   AVANÇAR STATUS
========================= */

window.avancarStatus = async (id, atual) => {

    try{

        const novo =
            STATUS_FLOW[atual] || "Entregue";

        await updateDoc(
            doc(db, "pedidos", id),
            {
                status: novo
            }
        );

    }catch(error){

        console.error(error);

        alert("Erro ao atualizar status.");
    }
};


/* =========================
   ENTREGUE
========================= */

window.entregue = async (id) => {

    try{

        await updateDoc(
            doc(db, "pedidos", id),
            {
                status: "Entregue"
            }
        );

    }catch(error){

        console.error(error);

        alert("Erro ao finalizar pedido.");
    }
};


/* =========================
   ARQUIVAR
========================= */

window.arquivar = async (id) => {

    const confirmar =
        confirm("Arquivar este pedido?");

    if(!confirmar) return;

    try{

        await updateDoc(
            doc(db, "pedidos", id),
            {
                arquivado: true
            }
        );

    }catch(error){

        console.error(error);

        alert("Erro ao arquivar.");
    }
};


/* =========================
   IMPRIMIR PEDIDO
========================= */

window.imprimirPedido = async (id) => {

    try{

        const snap =
            await getDoc(doc(db, "pedidos", id));

        const p = snap.data();

        const html = `

        <html>

        <head>

            <title>Comanda</title>

            <style>

                body{
                    font-family: monospace;
                    padding:20px;
                }

                .cupom{
                    width:320px;
                    margin:auto;
                    border:1px dashed #000;
                    padding:15px;
                }

                h1{
                    text-align:center;
                }

                .linha{
                    border-top:1px dashed #000;
                    margin:10px 0;
                }

                .total{
                    font-size:20px;
                    text-align:center;
                    font-weight:bold;
                }

            </style>

        </head>

        <body>

            <div class="cupom">

                <h1>
                    🍕 DELIVERY DA VIVI
                </h1>

                <div class="linha"></div>

                <p>
                    Cliente:
                    ${escapeHTML(p.nome)}
                </p>

                <p>
                    Telefone:
                    ${escapeHTML(p.telefone)}
                </p>

                <p>
                    Entrega:
                    ${escapeHTML(p.entrega)}
                </p>

                <p>
                    Endereço:
                    ${escapeHTML(p.endereco || "Retirada")}
                </p>

                <div class="linha"></div>

                <ul>

                    ${(p.itens || []).map(i => `

                        <li>
                            ${escapeHTML(i.quantity)}x
                            ${escapeHTML(i.name)}
                        </li>

                    `).join("")}

                </ul>

                <div class="linha"></div>

                <div class="total">

                    TOTAL:
                    R$ ${(p.total || 0).toFixed(2)}

                </div>

            </div>

        </body>

        </html>
        `;

        const janela =
            window.open("", "_blank");

        janela.document.write(html);

        janela.document.close();

        janela.print();

    }catch(error){

        console.error(error);

        alert("Erro ao imprimir pedido.");
    }
};