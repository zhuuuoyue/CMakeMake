#include "Editor.hpp"

Editor::Editor(QWidget* pParent)
    : QDialog{ pParent }
{
    m_editor.setupUi(this);
}
