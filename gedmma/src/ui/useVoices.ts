import { useEffect, useState } from 'react'
import { onVoicesReady, voices } from '../engine/audio'

/**
 * The device's voice list, which most browsers only fill in asynchronously —
 * so a component that shows or counts voices has to re-render when it lands.
 */
export function useVoices(): SpeechSynthesisVoice[] {
  const [list, setList] = useState<SpeechSynthesisVoice[]>(() => voices())
  useEffect(() => onVoicesReady(() => setList(voices())), [])
  return list
}
