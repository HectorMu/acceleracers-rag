import * as readline from 'readline'
import type { RAGService } from '../../application/services/rag.service.js'
import type { AppConfig } from '../../application/ports/config.js'

export function startCLI(rag: RAGService, config: AppConfig) {
  console.log('\n🏎️  AcceleRAG — Acceleracers AI\n' + '═'.repeat(50) + '\n')
  console.log(`💬  Chat ready — model: ${config.ollama.chatModel}`)
  console.log('   Type your question (or "exit" to quit)\n')
  console.log('─'.repeat(50))

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const prompt = () => {
    rl.question('\n> ', async (input) => {
      const q = input.trim()
      if (!q) return prompt()
      if (q.toLowerCase() === 'exit') {
        console.log('\n👋  Bye!')
        rl.close()
        return
      }

      process.stdout.write('\n🤖 ')
      const stream = rag.streamAnswer({ text: q })
      let fullText = ''
      let hadContent = false
      for await (const token of stream) {
        if (token.startsWith('||SOURCES||')) {
          try {
            const sources = JSON.parse(token.slice(11))
            if (hadContent) console.log()
            console.log(`\n📚 Sources: ${sources.map((s: any) => s.title).join(', ')}\n`)
          } catch {
            console.log('\n⚠️  Could not parse sources')
          }
        } else {
          process.stdout.write(token)
          fullText += token
          hadContent = true
        }
      }
      if (!hadContent) console.log('(no response)')
      prompt()
    })
  }

  prompt()
}
