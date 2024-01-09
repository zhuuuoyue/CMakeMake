#pragma once

#include <QDialog>
#include "ui_Editor.h"

class Editor : public QDialog {
public:
    explicit Editor(QWidget* pParent = Q_NULLPTR);
private:
    Ui::Editor m_editor;
};
