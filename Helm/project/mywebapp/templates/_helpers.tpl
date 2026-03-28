# templates/_helpers.tpl
{{/*
 Common labels applied to all resources
*/}}
{{- define "mywebapp.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}


{{/*
 Selector labels (subset of common labels)
*/}}
{{- define "mywebapp.selectorLabels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}


{{/*
 Compute the image tag — default to Chart appVersion
*/}}
{{- define "mywebapp.image" -}}
{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}
{{- end }}


{{/*
ServiceAccount name
*/}}
{{- define "mywebapp.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "mywebapp.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
default
{{- end -}}
{{- end }}


{{/*
Return the name of the chart
*/}}
{{- define "mywebapp.name" -}}
mywebapp
{{- end }}


{{/*
Full name (release + chart)
*/}}
{{- define "mywebapp.fullname" -}}
{{ .Release.Name }}-{{ include "mywebapp.name" . }}
{{- end }}