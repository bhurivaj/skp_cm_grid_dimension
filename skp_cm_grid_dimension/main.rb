# frozen_string_literal: true

require 'sketchup.rb'
require_relative 'generator'

module SkpCm
  module GridDimension
    # Classmat Suite (old combined plugin) — Grid now lives in this plugin
    def self.legacy_installed?
      plugins_dir = Sketchup.find_support_file('Plugins')
      !plugins_dir.nil? && File.exist?(File.join(plugins_dir, 'classmat_suite.rb'))
    end

    def self.legacy_message
      plugins_dir = Sketchup.find_support_file('Plugins')
      <<~MSG
        Classmat Suite (old version) is still installed.
        Grid Dimension and BoQ Counter are now separate plugins.

        Please close SketchUp and delete these items from:
        #{plugins_dir}

        - classmat_suite.rb
        - lib/boq/ (folder)
        - lib/grid/ (folder)
        - lib/core/config_manager.rb
        - icons/boq_icon.png
        - icons/grid_icon.png
        - classmat_config.json  (only after SKP CM BoQ Counter has been installed and started once — it copies your BoQ settings from this file)

        Then restart SketchUp.
      MSG
    end

    unless file_loaded?(__FILE__)
      toolbar = UI::Toolbar.new('SKP CM Grid')

      cmd = UI::Command.new('Grid Dimension') { Generator.show_dialog }
      cmd.tooltip = 'Create Grid Dimension'
      icon = File.join(PLUGIN_DIR, 'icons', 'grid_icon.png')
      cmd.large_icon = cmd.small_icon = icon if File.exist?(icon)
      toolbar.add_item(cmd)
      toolbar.show

      if legacy_installed?
        # Stop the timer first: a modal dialog inside a non-repeating timer makes it repeat (SketchUp API bug)
        timer_id = UI.start_timer(1, false) do
          UI.stop_timer(timer_id)
          UI.messagebox(legacy_message)
        end
      end

      file_loaded(__FILE__)
    end
  end
end
