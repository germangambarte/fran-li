import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { formatKilos, parseDecimal } from '@/lib/format'
import { useProducts, useSaveProduct } from '../hooks'
import type { PriceInput, ProductWithPrices } from '../types'

interface PriceDraft {
  minKg: string
  price: string
}

interface FormValues {
  name: string
  pricePerKg: string
  active: boolean
  prices: PriceDraft[]
}

function toFormValues(product: ProductWithPrices | undefined): FormValues {
  return {
    name: product?.name ?? '',
    pricePerKg:
      product?.price_per_kg != null ? String(product.price_per_kg) : '',
    active: product?.active ?? true,
    prices:
      product?.franli_product_prices.map((price) => ({
        minKg: String(price.min_kg),
        price: String(price.price),
      })) ?? [],
  }
}

export function ProductFormPage() {
  const { productId } = useParams()
  const { data: products, isPending } = useProducts()
  const product = productId
    ? products?.find((candidate) => candidate.id === productId)
    : undefined

  if (isPending) {
    return <p className="text-muted-foreground text-sm">Cargando…</p>
  }

  if (productId && !product) {
    return (
      <p className="text-muted-foreground text-sm">
        Producto no encontrado.{' '}
        <Link className="text-primary underline" to="/productos">
          Volver a productos
        </Link>
      </p>
    )
  }

  return (
    <ProductForm
      key={product?.id ?? 'nuevo'}
      productId={product?.id}
      initial={toFormValues(product)}
    />
  )
}

function ProductForm({
  productId,
  initial,
}: {
  productId?: string
  initial: FormValues
}) {
  const navigate = useNavigate()
  const saveProduct = useSaveProduct()
  const [values, setValues] = useState<FormValues>(initial)
  const [error, setError] = useState<string | null>(null)

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }))

  const updatePrice = (index: number, patch: Partial<PriceDraft>) =>
    setValues((previous) => ({
      ...previous,
      prices: previous.prices.map((price, i) =>
        i === index ? { ...price, ...patch } : price,
      ),
    }))

  const addPrice = () =>
    setValues((previous) => ({
      ...previous,
      prices: [...previous.prices, { minKg: '', price: '' }],
    }))

  const removePrice = (index: number) =>
    setValues((previous) => ({
      ...previous,
      prices: previous.prices.filter((_, i) => i !== index),
    }))

  function validate(): PriceInput[] | null {
    if (values.name.trim() === '') {
      setError('Ingresá un nombre para el producto.')
      return null
    }

    const pricePerKg = parseDecimal(values.pricePerKg)
    if (pricePerKg !== null && pricePerKg < 0) {
      setError('El precio por kilo no puede ser negativo.')
      return null
    }

    const seen = new Set<number>()
    const parsedPrices: PriceInput[] = []
    for (const [index, draft] of values.prices.entries()) {
      const minKg = parseDecimal(draft.minKg)
      const price = parseDecimal(draft.price)
      if (minKg === null || minKg <= 0) {
        setError(
          `Completá la cantidad de kilos de la modalidad ${index + 1}.`,
        )
        return null
      }
      if (price === null || price < 0) {
        setError(`Completá el precio de la modalidad ${index + 1}.`)
        return null
      }
      if (seen.has(minKg)) {
        setError(`La modalidad de ${formatKilos(minKg)} kg está repetida.`)
        return null
      }
      seen.add(minKg)
      parsedPrices.push({ min_kg: minKg, price })
    }

    if (pricePerKg === null && parsedPrices.length === 0) {
      setError('Cargá al menos un precio: por kilo o una modalidad.')
      return null
    }

    setError(null)
    return parsedPrices
  }

  async function handleSave() {
    const prices = validate()
    if (!prices) return

    try {
      await saveProduct.mutateAsync({
        id: productId,
        name: values.name.trim(),
        price_per_kg: parseDecimal(values.pricePerKg),
        active: values.active,
        prices,
      })
      navigate('/productos')
    } catch {
      setError('No se pudo guardar. Revisá la conexión e intentá de nuevo.')
    }
  }

  return (
    <>
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/productos')}
          aria-label="Volver"
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">
          {productId ? 'Editar producto' : 'Nuevo producto'}
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Datos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-name">Nombre</Label>
            <Input
              id="product-name"
              value={values.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="Ej: Pata y muslo"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="price-per-kg">
              Precio por kilo (opcional)
            </Label>
            <Input
              id="price-per-kg"
              inputMode="decimal"
              value={values.pricePerKg}
              onChange={(event) =>
                setField('pricePerKg', event.target.value)
              }
              placeholder="Ej: 7500"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="product-active">Producto activo</Label>
            <Switch
              id="product-active"
              checked={values.active}
              onCheckedChange={(active) => setField('active', active)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Promociones por cantidad</h2>
            <Button variant="outline" size="sm" onClick={addPrice}>
              <Plus />
              Agregar
            </Button>
          </div>

          {values.prices.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Sin promociones cargadas. Ej: 2 kg → $13000.
            </p>
          )}

          {values.prices.map((price, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <Label className="text-xs">Kilos</Label>
                <Input
                  inputMode="decimal"
                  value={price.minKg}
                  onChange={(event) =>
                    updatePrice(index, { minKg: event.target.value })
                  }
                  placeholder="2"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Label className="text-xs">Precio total</Label>
                <Input
                  inputMode="decimal"
                  value={price.price}
                  onChange={(event) =>
                    updatePrice(index, { price: event.target.value })
                  }
                  placeholder="13000"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removePrice(index)}
                aria-label={`Quitar modalidad ${index + 1}`}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        className="sticky bottom-4 h-12 w-full text-base"
        size="lg"
        onClick={handleSave}
        disabled={saveProduct.isPending}
      >
        {saveProduct.isPending ? 'Guardando…' : 'Guardar producto'}
      </Button>
    </>
  )
}
