import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { School, ShoppingBag, BarChart3 } from "lucide-react"

export default function Showcase() {
  const navigate = useNavigate()

  const features = [
    {
      icon: <ShoppingBag className="w-10 h-10 text-primary" />,
      title: "Easy Inventory",
      desc: "Easily monitor, add, or update your supplies in real-time with powerful search and smart stock tracking.",
    },
    {
      icon: <School className="w-10 h-10 text-primary" />,
      title: "Quick Sales",
      desc: "Process transactions swiftly with a seamless POS interface designed for speed and accuracy.",
    },
    {
      icon: <BarChart3 className="w-10 h-10 text-primary" />,
      title: "Analytics & Reports",
      desc: "Gain insights from interactive charts and smart analytics that keep your business informed.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="container mx-auto px-6 py-24 text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-5xl md:text-6xl font-extrabold tracking-tight"
        >
          <span className="text-foreground">School Supply System</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6"
        >
          Simplify your school supply management with smart inventory, sales tracking, and insightful analytics.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto mt-16"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="p-8 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all"
            >
              <div className="flex justify-center mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.7 }}
          className="mt-16"
        >
          <Button
            size="lg"
            className="px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-2xl transition-all"
            onClick={() => navigate("/login")}
          >
            Get Started
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
