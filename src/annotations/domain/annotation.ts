export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationBase {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  position: Rectangle;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  color?: string;
  opacity?: number;
}

export interface HighlightAnnotation extends AnnotationBase {
  type: 'highlight';
  text?: string;
  color: string;
  opacity: number;
}

export interface CommentAnnotation extends AnnotationBase {
  type: 'comment';
  content: string;
  isResolved?: boolean;
}

export interface DrawingAnnotation extends AnnotationBase {
  type: 'drawing';
  points: Point[];
  strokeWidth: number;
  strokeColor: string;
}

export interface TextAnnotation extends AnnotationBase {
  type: 'text';
  content: string;
  fontSize: number;
  fontColor: string;
}

export type Annotation = 
  | HighlightAnnotation 
  | CommentAnnotation 
  | DrawingAnnotation 
  | TextAnnotation;

export type AnnotationType = 'highlight' | 'comment' | 'drawing' | 'text';

export interface AnnotationLayer {
  pageNumber: number;
  annotations: Annotation[];
}

export interface AnnotationDocument {
  id: string;
  submissionId: string;
  fileId: string;
  layers: AnnotationLayer[];
  version: number;
  lastSaved: Date;
}
