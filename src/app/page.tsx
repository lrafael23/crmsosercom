"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Scale, Calculator, Receipt, FolderOpen, Briefcase, MessageSquare, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { StatCard } from "@/components/dashboard-ui";

const kpisCliente = [
  { label: "Trámites activos", value: "12", sub: "+2 esta semana", icon: Briefcase },
  { label: "Documentos pendientes", value: "5", sub: "2 observados", icon: FolderOpen },
  { label: "Tickets abiertos", value: "4", sub: "1 urgente", icon: MessageSquare },
  { label: "Impuesto estimado", value: "$1.480.000", sub: "Vence en 9 días", icon: Receipt },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white p-3 text-neutral-950">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Portal 360</p>
              <p className="font-medium text-white">Jurídico • Contable • Tributario</p>
            </div>
          </div>
          <div className="hidden gap-3 md:flex">
            <Link href="/login">
              <Button variant="outline" className="rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10">
                Ingresar
              </Button>
            </Link>
            <Button className="rounded-2xl bg-white text-neutral-950 hover:bg-neutral-200">
              Agendar diagnóstico
            </Button>
          </div>
        </div>

        <div className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Badge className="rounded-full bg-white/10 px-4 py-1.5 text-white border-transparent">
              SaaS para firmas legales, contables y tributarias
            </Badge>
            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl text-white">
              La forma elegante de mostrar al cliente el estado real de su negocio
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
              Un portal simple para captar clientes, gestionar documentos, controlar trámites, proyectar impuestos,
              centralizar soporte y medir el desempeño interno de cada departamento.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login">
                <Button className="rounded-2xl bg-white px-6 py-6 text-neutral-950 hover:bg-neutral-200 text-md">
                  Ingresar al demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" className="rounded-2xl border-white/20 bg-transparent px-6 py-6 text-white hover:bg-white/10 text-md">
                Solicitar diagnóstico
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur"
          >
            <div className="rounded-[28px] bg-white p-4 text-neutral-950">
              <div className="grid gap-4 md:grid-cols-2">
                {kpisCliente.map((item) => (
                  <StatCard key={item.label} item={item} />
                ))}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <Card className="rounded-3xl border-neutral-200/70">
                  <CardHeader>
                    <CardTitle className="text-lg">Áreas del negocio</CardTitle>
                    <CardDescription>Resumen operativo por departamento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4">
                      <div className="flex items-center gap-3"><Scale className="h-5 w-5" /><span>Jurídico</span></div>
                      <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-50">4 trámites</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4">
                      <div className="flex items-center gap-3"><Calculator className="h-5 w-5" /><span>Contable</span></div>
                      <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">2 observaciones</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4">
                      <div className="flex items-center gap-3"><Receipt className="h-5 w-5" /><span>Tributario</span></div>
                      <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50">Pago próximo</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-3xl border-neutral-200/70">
                  <CardHeader>
                    <CardTitle className="text-lg">Acciones rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800">Subir documentos</Button>
                    <Button variant="outline" className="w-full rounded-2xl">Solicitar asesoría</Button>
                    <Button variant="outline" className="w-full rounded-2xl">Agendar reunión</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
