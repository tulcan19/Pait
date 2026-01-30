-- CreateTable
CREATE TABLE "Usuarios" (
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("usuarioId")
);

-- CreateTable
CREATE TABLE "Productos" (
    "productoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "calificacion" DOUBLE PRECISION,
    "cantidadenstock" INTEGER NOT NULL,

    CONSTRAINT "Products_pkey" PRIMARY KEY ("productoId")
);

-- CreateTable
CREATE TABLE "Ventas" (
    "ventasId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "registrodehora" TIMESTAMP(3) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "preciounitario" DOUBLE PRECISION NOT NULL,
    "cantidadtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Ventas_pkey" PRIMARY KEY ("ventasId")
);

-- CreateTable
CREATE TABLE "Compras" (
    "compradoId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "registrodehora" TIMESTAMP(3) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costounitario" DOUBLE PRECISION NOT NULL,
    "costototal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Compras_pkey" PRIMARY KEY ("compradoId")
);

-- CreateTable
CREATE TABLE "Gastos" (
    "expensadoId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "registrodehora" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gastos_pkey" PRIMARY KEY ("expensadoId")
);

-- CreateTable
CREATE TABLE "Resumendeventas" (
    "ResumendeventasId" TEXT NOT NULL,
    "valortotal" DOUBLE PRECISION NOT NULL,
    "porcentajeCambio" DOUBLE PRECISION,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resumendeventas_pkey" PRIMARY KEY ("ResumendeventasId")
);

-- CreateTable
CREATE TABLE "Resumendelacompra" (
    "ResumendelacompraId" TEXT NOT NULL,
    "totalComprado" DOUBLE PRECISION NOT NULL,
    "porcentajeCambio" DOUBLE PRECISION,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resumendelacompra_pkey" PRIMARY KEY ("ResumendelacompraId")
);

-- CreateTable
CREATE TABLE "ResumendeGastos" (
    "resumenGastosId" TEXT NOT NULL,
    "gastoTotal" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumendeGastos_pkey" PRIMARY KEY ("resumenGastosId")
);

-- CreateTable
CREATE TABLE "GastoPorCategoria" (
    "gastoPorCategoriaId" TEXT NOT NULL,
    "resumenGastosId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "cantidad" BIGINT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GastoPorCategoria_pkey" PRIMARY KEY ("gastoPorCategoriaId")
);

-- AddForeignKey
ALTER TABLE "Ventas" ADD CONSTRAINT "Resumen_de_ventasId_fkey" FOREIGN KEY ("productoId") REFERENCES "Products"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compras" ADD CONSTRAINT "Compras_productId_fkey" FOREIGN KEY ("productoId") REFERENCES "Products"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoPorCategoría" ADD CONSTRAINT "ExpenseByCategory_expenseSummaryId_fkey" FOREIGN KEY ("expenseSummaryId") REFERENCES "ExpenseSummary"("expenseSummaryId") ON DELETE RESTRICT ON UPDATE CASCADE;
