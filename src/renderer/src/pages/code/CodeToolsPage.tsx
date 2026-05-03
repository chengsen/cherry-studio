import { AiProvider } from '@renderer/aiCore'
import AnthropicProviderListPopover from '@renderer/components/AnthropicProviderListPopover'
import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import ModelSelector from '@renderer/components/ModelSelector'
import Scrollbar from '@renderer/components/Scrollbar'
import { isMac, isWin } from '@renderer/config/constant'
import { isEmbeddingModel, isRerankModel, isTextToImageModel } from '@renderer/config/models'
import { useCodeTools } from '@renderer/hooks/useCodeTools'
import { useProviders } from '@renderer/hooks/useProvider'
import { useTimer } from '@renderer/hooks/useTimer'
import { getAssistantSettings, getProviderByModel } from '@renderer/services/AssistantService'
import { loggerService } from '@renderer/services/LoggerService'
import { getModelUniqId } from '@renderer/services/ModelService'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { setIsBunInstalled } from '@renderer/store/mcp'
import type { EndpointType, Model } from '@renderer/types'
import type { TerminalConfig } from '@shared/config/constant'
import { codeTools, terminalApps } from '@shared/config/constant'
import { CLAUDE_OFFICIAL_SUPPORTED_PROVIDERS, isSiliconAnthropicCompatibleModel } from '@shared/config/providers'
import { Alert, Button, Checkbox, Input, Select, Space, Tooltip } from 'antd'
import { Download, FolderOpen, Plus, Terminal, Trash2 } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  CLI_TOOL_PROVIDER_MAP,
  CLI_TOOLS,
  generateToolEnvironment,
  OPENAI_CODEX_SUPPORTED_PROVIDERS,
  parseEnvironmentVariables
} from '.'

const logger = loggerService.withContext('CodeToolsPage')

const getDirName = (dir: string): string => {
  const parts = dir.split(/[/\\]/)
  return parts[parts.length - 1] || dir
}

const CodeToolsPage: FC = () => {
  const { t } = useTranslation()
  const { providers } = useProviders()
  const dispatch = useAppDispatch()
  const isBunInstalled = useAppSelector((state) => state.mcp.isBunInstalled)
  const {
    selectedCliTool,
    selectedModel,
    selectedTerminal,
    environmentVariables,
    directories,
    currentDirectory,
    canLaunch,
    setCliTool,
    setModel,
    setTerminal,
    setEnvVars,
    setCurrentDir,
    removeDir,
    addDir
  } = useCodeTools()
  const { setTimeoutTimer } = useTimer()

  // Get default assistant settings for budget tokens calculation
  const defaultAssistant = useAppSelector((state) => state.assistants.defaultAssistant)
  const { maxTokens, reasoning_effort } = useMemo(() => {
    if (!defaultAssistant) {
      return { maxTokens: undefined, reasoning_effort: undefined }
    }
    return getAssistantSettings(defaultAssistant)
  }, [defaultAssistant])

  const [isLaunching, setIsLaunching] = useState(false)
  const [isInstallingBun, setIsInstallingBun] = useState(false)
  const [autoUpdateToLatest, setAutoUpdateToLatest] = useState(false)
  const [availableTerminals, setAvailableTerminals] = useState<TerminalConfig[]>([])
  const [isLoadingTerminals, setIsLoadingTerminals] = useState(false)
  const [terminalCustomPaths, setTerminalCustomPaths] = useState<Record<string, string>>({})

  const modelPredicate = useCallback(
    (m: Model) => {
      if (isEmbeddingModel(m) || isRerankModel(m) || isTextToImageModel(m)) {
        return false
      }

      if (m.provider === 'cherryai') {
        return false
      }

      if (selectedCliTool === codeTools.claudeCode) {
        if (m.supported_endpoint_types) {
          return m.supported_endpoint_types.includes('anthropic')
        }
        // Special handling for silicon provider: only specific models support Anthropic API
        if (m.provider === 'silicon') {
          return isSiliconAnthropicCompatibleModel(m.id)
        }
        // Check if model belongs to an anthropic type provider or has anthropicApiHost
        const modelProvider = providers.find((p) => p.id === m.provider)
        if (modelProvider?.type === 'anthropic' || modelProvider?.anthropicApiHost) {
          return true
        }
        return m.id.includes('claude') || CLAUDE_OFFICIAL_SUPPORTED_PROVIDERS.includes(m.provider)
      }

      if (selectedCliTool === codeTools.geminiCli) {
        if (m.supported_endpoint_types) {
          return m.supported_endpoint_types.includes('gemini')
        }
        return m.id.includes('gemini')
      }

      if (selectedCliTool === codeTools.openaiCodex) {
        if (m.supported_endpoint_types) {
          return ['openai', 'openai-response'].some((type) =>
            m.supported_endpoint_types?.includes(type as EndpointType)
          )
        }
        // Check if model belongs to an openai-response type provider (including custom providers)
        const openaiProvider = providers.find((p) => p.id === m.provider)
        if (openaiProvider?.type === 'openai-response') {
          return true
        }
        return m.id.includes('openai') || OPENAI_CODEX_SUPPORTED_PROVIDERS.includes(m.provider)
      }

      if (selectedCliTool === codeTools.githubCopilotCli) {
        return false
      }

      if (selectedCliTool === codeTools.qwenCode || selectedCliTool === codeTools.iFlowCli) {
        if (m.supported_endpoint_types) {
          return ['openai', 'openai-response'].some((type) =>
            m.supported_endpoint_types?.includes(type as EndpointType)
          )
        }
        return true
      }

      if (selectedCliTool === codeTools.openCode) {
        if (m.supported_endpoint_types) {
          return ['openai', 'openai-response', 'anthropic'].some((type) =>
            m.supported_endpoint_types?.includes(type as EndpointType)
          )
        }
        // Check if model belongs to openai, openai-response, or anthropic type provider
        const provider = providers.find((p) => p.id === m.provider)
        return !!['openai', 'openai-response', 'anthropic', 'new-api'].includes(provider?.type ?? '')
      }

      return true
    },
    [selectedCliTool, providers]
  )

  const availableProviders = useMemo(() => {
    const filterFn = CLI_TOOL_PROVIDER_MAP[selectedCliTool]
    return filterFn ? filterFn(providers) : []
  }, [providers, selectedCliTool])

  const handleModelChange = (value: string) => {
    if (!value) {
      setModel(null)
      return
    }

    // 从所有 providers 中查找选中的模型
    for (const provider of providers || []) {
      const model = provider.models.find((m) => getModelUniqId(m) === value)
      if (model) {
        setModel(model)
        break
      }
    }
  }

  // 处理删除目录
  const handleRemoveDirectory = (directory: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    removeDir(directory)
  }

  // 检查 bun 是否安装
  const checkBunInstallation = useCallback(async () => {
    try {
      const bunExists = await window.api.isBinaryExist('bun')
      dispatch(setIsBunInstalled(bunExists))
    } catch (error) {
      logger.error('Failed to check bun installation status:', error as Error)
      dispatch(setIsBunInstalled(false))
    }
  }, [dispatch])

  // 获取可用终端
  const loadAvailableTerminals = useCallback(async () => {
    if (!isMac && !isWin) return // 仅 macOS 和 Windows 支持

    try {
      setIsLoadingTerminals(true)
      const terminals = await window.api.codeTools.getAvailableTerminals()
      setAvailableTerminals(terminals)
      logger.info(
        `Found ${terminals.length} available terminals:`,
        terminals.map((t) => t.name)
      )
    } catch (error) {
      logger.error('Failed to load available terminals:', error as Error)
      setAvailableTerminals([])
    } finally {
      setIsLoadingTerminals(false)
    }
  }, [])

  // 安装 bun
  const handleInstallBun = async () => {
    try {
      setIsInstallingBun(true)
      await window.api.installBunBinary()
      dispatch(setIsBunInstalled(true))
      window.toast.success(t('settings.mcp.installSuccess'))
    } catch (error: any) {
      logger.error('Failed to install bun:', error as Error)
      window.toast.error(`${t('settings.mcp.installError')}: ${error.message}`)
    } finally {
      setIsInstallingBun(false)
      // 重新检查安装状态
      setTimeoutTimer('handleInstallBun', checkBunInstallation, 1000)
    }
  }

  // 验证启动条件
  const validateLaunch = (): { isValid: boolean; message?: string } => {
    if (!canLaunch || !isBunInstalled) {
      return {
        isValid: false,
        message: !isBunInstalled ? t('code.launch.bun_required') : t('code.launch.validation_error')
      }
    }

    if (!selectedModel && selectedCliTool !== codeTools.githubCopilotCli) {
      return { isValid: false, message: t('code.model_required') }
    }

    return { isValid: true }
  }

  // 准备启动环境
  const prepareLaunchEnvironment = async (): Promise<{
    env: Record<string, string>
  } | null> => {
    if (selectedCliTool === codeTools.githubCopilotCli) {
      const userEnv = parseEnvironmentVariables(environmentVariables)
      return { env: userEnv }
    }

    if (!selectedModel) return null

    const modelProvider = getProviderByModel(selectedModel)
    const aiProvider = new AiProvider(modelProvider)
    const baseUrl = aiProvider.getBaseURL()
    const apiKey = aiProvider.getApiKey()

    // 生成工具特定的环境变量
    const { env: toolEnv } = generateToolEnvironment({
      tool: selectedCliTool,
      model: selectedModel,
      modelProvider,
      apiKey,
      baseUrl,
      context: { maxTokens, reasoningEffort: reasoning_effort }
    })

    // 合并用户自定义的环境变量
    const userEnv = parseEnvironmentVariables(environmentVariables)

    return { env: { ...toolEnv, ...userEnv } }
  }

  // 执行启动操作
  const executeLaunch = async (env: Record<string, string>) => {
    const modelId = selectedCliTool === codeTools.githubCopilotCli ? '' : selectedModel?.id!

    const runOptions = {
      autoUpdateToLatest,
      terminal: selectedTerminal
    }

    try {
      const result = await window.api.codeTools.run(selectedCliTool, modelId, currentDirectory, env, runOptions)
      if (result && result.success) {
        window.toast.success(t('code.launch.success'))
      } else {
        window.toast.error(result?.message || t('code.launch.error'))
      }
    } catch (error) {
      logger.error('codeTools.run failed:', error as Error)
      window.toast.error(t('code.launch.error'))
    }
  }

  // 设置终端自定义路径
  const handleSetCustomPath = async (terminalId: string) => {
    try {
      const result = await window.api.file.select({
        properties: ['openFile'],
        filters: [
          { name: 'Executable', extensions: ['exe'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (result && result.length > 0) {
        const path = result[0].path
        await window.api.codeTools.setCustomTerminalPath(terminalId, path)
        setTerminalCustomPaths((prev) => ({ ...prev, [terminalId]: path }))
        window.toast.success(t('code.custom_path_set'))
        // Reload terminals to reflect changes
        void loadAvailableTerminals()
      }
    } catch (error) {
      logger.error('Failed to set custom terminal path:', error as Error)
      window.toast.error(t('code.custom_path_error'))
    }
  }

  // 处理启动
  const handleLaunch = async () => {
    const validation = validateLaunch()

    if (!validation.isValid) {
      window.toast.warning(validation.message || t('code.launch.validation_error'))
      return
    }

    setIsLaunching(true)

    try {
      const result = await prepareLaunchEnvironment()
      if (!result) {
        window.toast.error(t('code.model_required'))
        return
      }

      await executeLaunch(result.env)
    } catch (error) {
      logger.error('start code tools failed:', error as Error)
      window.toast.error(t('code.launch.error'))
    } finally {
      setIsLaunching(false)
    }
  }

  // 添加目录
  const handleAddDirectory = useCallback(async () => {
    try {
      const folderPath = await window.api.file.selectFolder()
      if (folderPath) {
        addDir(folderPath)
        setCurrentDir(folderPath)
      }
    } catch (error) {
      logger.error('选择文件夹失败:', error as Error)
    }
  }, [addDir, setCurrentDir])

  // 页面加载时检查 bun 安装状态
  useEffect(() => {
    void checkBunInstallation()
  }, [checkBunInstallation])

  // 页面加载时获取可用终端
  useEffect(() => {
    void loadAvailableTerminals()
  }, [loadAvailableTerminals])

  return (
    <Container>
      <Navbar>
        <NavbarCenter style={{ borderRight: 'none' }}>{t('code.title')}</NavbarCenter>
      </Navbar>
      <ContentContainer id="content-container">
        {/* 左侧工作目录侧边栏 */}
        <DirectorySidebar>
          <SidebarHeader>
            <SidebarTitle>{t('code.working_directory')}</SidebarTitle>
            <Tooltip title={t('code.select_folder')}>
              <AddButton onClick={handleAddDirectory}>
                <Plus size={14} />
              </AddButton>
            </Tooltip>
          </SidebarHeader>
          <DirectoryList>
            {directories.length === 0 && <EmptyText>{t('code.folder_placeholder')}</EmptyText>}
            {directories.map((dir) => {
              const isActive = dir === currentDirectory
              return (
                <DirectoryItem key={dir} $active={isActive} onClick={() => setCurrentDir(dir)}>
                  <DirectoryName title={dir}>
                    <FolderOpen size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
                    <span className="name">{getDirName(dir)}</span>
                  </DirectoryName>
                  <DeleteButton onClick={(e) => handleRemoveDirectory(dir, e)} title={t('common.delete')}>
                    <Trash2 size={12} />
                  </DeleteButton>
                </DirectoryItem>
              )
            })}
          </DirectoryList>
        </DirectorySidebar>

        {/* 右侧主内容区 */}
        <MainScrollArea>
          <MainContent>
            <Title>{t('code.title')}</Title>
            <Description>{t('code.description')}</Description>

            {/* Bun 安装状态提示 */}
            {!isBunInstalled && (
              <BunInstallAlert>
                <Alert
                  type="warning"
                  banner
                  style={{ borderRadius: 'var(--list-item-border-radius)' }}
                  message={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                      <span>{t('code.bun_required_message')}</span>
                      <Button
                        type="primary"
                        size="small"
                        icon={<Download size={14} />}
                        onClick={handleInstallBun}
                        loading={isInstallingBun}
                        disabled={isInstallingBun}>
                        {isInstallingBun ? t('code.installing_bun') : t('code.install_bun')}
                      </Button>
                    </div>
                  }
                />
              </BunInstallAlert>
            )}

            <SettingsPanel>
              <SettingsItem>
                <div className="settings-label">{t('code.cli_tool')}</div>
                <Select
                  style={{ width: '100%' }}
                  placeholder={t('code.cli_tool_placeholder')}
                  value={selectedCliTool}
                  onChange={setCliTool}
                  options={CLI_TOOLS}
                />
              </SettingsItem>

              {selectedCliTool !== codeTools.githubCopilotCli && (
                <SettingsItem>
                  <div className="settings-label">
                    {t('code.model')}
                    {selectedCliTool === 'claude-code' && <AnthropicProviderListPopover />}
                  </div>
                  <ModelSelector
                    providers={availableProviders}
                    predicate={modelPredicate}
                    style={{ width: '100%' }}
                    placeholder={t('code.model_placeholder')}
                    value={selectedModel ? getModelUniqId(selectedModel) : undefined}
                    onChange={handleModelChange}
                    allowClear
                  />
                </SettingsItem>
              )}

              <SettingsItem>
                <div className="settings-label">{t('code.environment_variables')}</div>
                <Input.TextArea
                  placeholder={`KEY1=value1\nKEY2=value2`}
                  value={environmentVariables}
                  onChange={(e) => setEnvVars(e.target.value)}
                  rows={2}
                  style={{ fontFamily: 'monospace' }}
                />
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-3)',
                    marginTop: 4
                  }}>
                  {t('code.env_vars_help')}
                </div>
              </SettingsItem>

              {/* 终端选择 (macOS 和 Windows) */}
              {(isMac || isWin) && (
                <SettingsItem>
                  <div className="settings-label">{t('code.terminal')}</div>
                  {availableTerminals.length > 0 ? (
                    <>
                      <Space.Compact style={{ width: '100%', display: 'flex' }}>
                        <Select
                          style={{ flex: 1 }}
                          placeholder={t('code.terminal_placeholder')}
                          value={selectedTerminal}
                          onChange={setTerminal}
                          loading={isLoadingTerminals}
                          options={availableTerminals.map((terminal) => ({
                            value: terminal.id,
                            label: terminal.name
                          }))}
                        />
                        {/* Show custom path button for Windows terminals except cmd/powershell */}
                        {isWin &&
                          selectedTerminal &&
                          selectedTerminal !== terminalApps.cmd &&
                          selectedTerminal !== terminalApps.powershell &&
                          selectedTerminal !== terminalApps.windowsTerminal && (
                            <Tooltip title={terminalCustomPaths[selectedTerminal] || t('code.set_custom_path')}>
                              <Button
                                icon={<FolderOpen size={16} />}
                                onClick={() => handleSetCustomPath(selectedTerminal)}
                              />
                            </Tooltip>
                          )}
                      </Space.Compact>
                      {isWin &&
                        selectedTerminal &&
                        selectedTerminal !== terminalApps.cmd &&
                        selectedTerminal !== terminalApps.powershell &&
                        selectedTerminal !== terminalApps.windowsTerminal && (
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--color-text-3)',
                              marginTop: 4
                            }}>
                            {terminalCustomPaths[selectedTerminal]
                              ? `${t('code.custom_path')}: ${terminalCustomPaths[selectedTerminal]}`
                              : t('code.custom_path_required')}
                          </div>
                        )}
                    </>
                  ) : (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-3)'
                      }}>
                      {isLoadingTerminals ? t('code.terminal_loading') : t('code.terminal_not_detected')}
                    </div>
                  )}
                </SettingsItem>
              )}

              <SettingsItem>
                <div className="settings-label">{t('code.update_options')}</div>
                <Checkbox checked={autoUpdateToLatest} onChange={(e) => setAutoUpdateToLatest(e.target.checked)}>
                  {t('code.auto_update_to_latest')}
                </Checkbox>
              </SettingsItem>
            </SettingsPanel>

            <Button
              type="primary"
              icon={<Terminal size={16} />}
              size="large"
              onClick={handleLaunch}
              loading={isLaunching}
              disabled={!canLaunch || !isBunInstalled}
              block>
              {isLaunching ? t('code.launching') : t('code.launch.label')}
            </Button>
          </MainContent>
        </MainScrollArea>
      </ContentContainer>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  overflow: hidden;
`

const DirectorySidebar = styled.div`
  display: flex;
  flex-direction: column;
  width: var(--assistants-width);
  min-width: var(--assistants-width);
  height: calc(100vh - var(--navbar-height));
  background-color: var(--color-background);
  border-right: 0.5px solid var(--color-border);
  overflow: hidden;
`

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 0.5px solid var(--color-border);
  -webkit-app-region: no-drag;
`

const SidebarTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
`

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--color-text-2);
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--color-background-mute);
    color: var(--color-text-1);
  }
`

const DirectoryList = styled(Scrollbar)`
  flex: 1;
  padding: 6px;
  overflow-y: auto;
`

const DirectoryItem = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  margin-bottom: 2px;
  background-color: ${({ $active }) => ($active ? 'var(--color-background-mute)' : 'transparent')};

  &:hover {
    background-color: var(--color-background-mute);
  }
`

const DirectoryName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;

  .name {
    font-size: 13px;
    color: var(--color-text-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--color-text-3);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, background-color 0.15s;
  flex-shrink: 0;

  ${DirectoryItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background-color: rgba(255, 0, 0, 0.1);
    color: var(--color-error);
  }
`

const EmptyText = styled.div`
  font-size: 12px;
  color: var(--color-text-3);
  text-align: center;
  padding: 20px 12px;
`

const MainScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
`

const MainContent = styled.div`
  width: 600px;
  margin: auto;
  min-height: fit-content;
`

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--color-text-1);
`

const Description = styled.p`
  font-size: 14px;
  color: var(--color-text-2);
  margin-bottom: 32px;
  line-height: 1.5;
`

const SettingsPanel = styled.div`
  margin-bottom: 32px;
`

const SettingsItem = styled.div`
  margin-bottom: 24px;

  .settings-label {
    font-size: 14px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-text-1);
    font-weight: 500;
  }
`

const BunInstallAlert = styled.div`
  margin-bottom: 24px;
`

export default CodeToolsPage
