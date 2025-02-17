import React from "react"
import { clamp, useInterval } from "utils"
import { EditorProps, EditorStep } from "../mini-editor"
import { InnerCode, updateEditorStep } from "./code"
import { Preview, PresetConfig } from "./preview"
import { extractPreviewSteps } from "./steps"

type ChangeEvent = {
  index: number
}

export function Slideshow({
  children,
  className,
  code,
  codeConfig,
  editorSteps,
  autoFocus,
  hasPreviewSteps,
  // Set the initial slide index
  start = 0,
  // Called when the slideshow state changes and returns the current state object
  onChange: onSlideshowChange = () => {},
  presetConfig,
  style,
  autoPlay,
  loop = false,
  ...rest
}: {
  children: React.ReactNode
  className?: string
  code?: EditorProps["codeConfig"]
  codeConfig: EditorProps["codeConfig"]
  editorSteps: EditorStep[]
  hasPreviewSteps?: boolean
  autoFocus?: boolean
  start?: number
  onChange?: (e: ChangeEvent) => void
  presetConfig?: PresetConfig
  style?: React.CSSProperties
  autoPlay?: number
  loop?: boolean
}) {
  const { stepsChildren, previewChildren } =
    extractPreviewSteps(children, hasPreviewSteps)
  const withPreview = presetConfig || hasPreviewSteps

  const hasNotes = stepsChildren.some(
    (child: any) => child.props?.children
  )

  const maxSteps = editorSteps.length - 1

  const [state, setState] = React.useState(() => {
    const startIndex = clamp(start, 0, maxSteps)
    return {
      stepIndex: startIndex,
      step: editorSteps[startIndex],
    }
  })

  const { stepIndex: currentIndex, step: tab } = state

  const atSlideshowEnd = currentIndex === maxSteps

  React.useEffect(() => {
    onSlideshowChange({ index: currentIndex })
  }, [currentIndex])

  function onTabClick(filename: string) {
    const newStep = updateEditorStep(tab, filename, null)
    setState({ ...state, step: newStep })
  }

  function setIndex(newIndex: number) {
    const stepIndex = clamp(newIndex, 0, maxSteps)
    setState({ stepIndex, step: editorSteps[stepIndex] })
  }

  function nextSlide() {
    setState(s => {
      const stepIndex = loop
        ? (s.stepIndex + 1) % (maxSteps + 1)
        : clamp(s.stepIndex + 1, 0, maxSteps)
      return {
        stepIndex,
        step: editorSteps[stepIndex],
      }
    })
  }

  useInterval(nextSlide, autoPlay)

  return (
    <div
      className={`ch-slideshow ${
        withPreview ? "ch-slideshow-with-preview" : ""
      } ${className || ""}`}
      style={style}
    >
      <div className="ch-slideshow-slide">
        <InnerCode
          {...rest}
          {...(tab as any)}
          codeConfig={{
            ...codeConfig,
            ...code,
          }}
          onTabClick={onTabClick}
        />
        {presetConfig ? (
          <Preview
            className="ch-slideshow-preview"
            files={tab.files}
            presetConfig={presetConfig}
            codeConfig={codeConfig}
          />
        ) : hasPreviewSteps ? (
          <Preview
            className="ch-slideshow-preview"
            {...previewChildren[currentIndex]["props"]}
          />
        ) : null}
      </div>

      <div className="ch-slideshow-notes">
        <div className="ch-slideshow-range">
          <button
            onClick={() => setIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            Prev
          </button>
          <input
            max={maxSteps}
            min={0}
            step={1}
            type="range"
            value={currentIndex}
            onChange={e => setIndex(+e.target.value)}
            ref={useAutoFocusRef(autoFocus)}
            autoFocus={autoFocus}
          />
          <button
            onClick={nextSlide}
            disabled={atSlideshowEnd}
          >
            Next
          </button>
        </div>
        {hasNotes && (
          <div className="ch-slideshow-note">
            {stepsChildren[currentIndex]}
          </div>
        )}
      </div>
    </div>
  )
}

function useAutoFocusRef(autoFocus: boolean) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    autoFocus && ref.current.focus()
  }, [])
  return ref
}
